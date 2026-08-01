import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { SITE_URL } from "@/lib/env";
import { centerLimits } from "@/lib/plans";

/**
 * Rəy dəvəti — müayinə tamamlandıqdan sonra pasiyentə birdəfəlik link ilə SMS.
 *
 * NƏ ÜÇÜN: 246 mərkəzdən yalnız 1-ində rəy var, çünki heç kim rəy istəmir.
 * Rəy forması COMPLETED sorğuya bağlıdır, amma pasiyent saytа geri qayıtmır.
 *
 * NİYƏ OTP YOXDUR (QR axınından fərqli olaraq): QR-i küçədən kimsə skan edə
 * bilər, ona görə orada nömrə OTP ilə təsdiqlənir. Burada isə linki BİZ məhz
 * həmin sorğudakı nömrəyə göndəririk — tokenin özü sahibliyi sübut edir.
 * Bir toxunuşla rəy = qat-qat yüksək konversiya. Token birdəfəlikdir və
 * müddəti bitir.
 *
 * DÜRÜSTLÜK: rəy YALNIZ real, tamamlanmış müayinədən sonra yaranır və
 * pasiyentin öz adı ilə gedir — uydurma rəy yaradılmır.
 */

/** Dəvət linki bu qədər gün sonra işləmir. */
export const INVITE_TTL_DAYS = 30;
/** Müayinə bitəndən sonra ən azı bu qədər gözlə (pasiyent hələ mərkəzdə ola bilər). */
export const INVITE_DELAY_MS = 2 * 60 * 60 * 1000;
/**
 * Bundan köhnə sorğuya dəvət göndərilmir. Çoxdan olmuş müayinə haqqında SMS
 * həm yersizdir, həm də cavab verilmir. (`completedAt` sistem qurulmazdan
 * əvvəlki sətirlərdə geriyə doldurulduğu üçün yaş `createdAt` ilə ölçülür.)
 */
export const INVITE_MAX_AGE_DAYS = 60;

export function newReviewToken(): string {
  return randomBytes(16).toString("hex");
}

export function inviteUrl(token: string): string {
  return `${SITE_URL}/rey/davet/${token}`;
}

/** SMS mətni — qısa saxlanılır (seqment sayı = pul). Uzun mərkəz adı kəsilir. */
export function inviteSms(centerName: string, token: string): string {
  const name = centerName.length > 32 ? `${centerName.slice(0, 31).trimEnd()}…` : centerName;
  return `${name} — müayinəniz üçün təşəkkür edirik! Rəy yazın: ${inviteUrl(token)}`;
}

export type InviteResult = { sent: number; skipped: number; failed: number };

/**
 * Dəvət göndərilməli sorğuları tapıb SMS atır.
 *
 * `completedAt` boş olan köhnə sorğular (status axını bu sahədən əvvəl
 * yazılanlar) DƏRHAL göndərilmir — əvvəlcə `completedAt` doldurulur, dəvət
 * növbəti icrada gedir. Beləliklə heç bir yol qaçırılmır və gecikmə qorunur.
 */
export async function runReviewInvites(
  limit = 200,
  /** true → heç nə göndərilmir/yazılmır, yalnız kimin alacağı hesablanır. */
  dryRun = false,
): Promise<InviteResult & { targets: { name: string; phone: string; center: string }[] }> {
  const now = new Date();

  // 1) Köhnə/izsiz COMPLETED sorğulara vaxt damğası qoy (dəvət növbəti icrada).
  if (!dryRun) {
    await prisma.appointmentRequest.updateMany({
      where: { status: "COMPLETED", completedAt: null },
      data: { completedAt: now },
    });
  }

  // 2) Göndərməyə hazır olanlar.
  const due = await prisma.appointmentRequest.findMany({
    where: {
      status: "COMPLETED",
      reviewInviteSentAt: null,
      ...(dryRun
        ? {}
        : { completedAt: { not: null, lte: new Date(now.getTime() - INVITE_DELAY_MS) } }),
      centerId: { not: null },
      // Çoxdankı müayinə haqqında SMS atmırıq.
      createdAt: { gte: new Date(now.getTime() - INVITE_MAX_AGE_DAYS * 864e5) },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      patientId: true,
      center: { select: { id: true, name: true, plan: true } },
    },
    take: limit,
    orderBy: { completedAt: "asc" },
  });

  const res: InviteResult & { targets: { name: string; phone: string; center: string }[] } = {
    sent: 0, skipped: 0, failed: 0, targets: [],
  };

  // Bir nəfər eyni mərkəzə bir neçə dəfə gedə bilər, amma rəy (centerId, patientId)
  // üzrə TƏKDİR — ona görə həmin cütə yalnız BİR dəvət göndəririk.
  const invitedPairs = new Set<string>();

  for (const r of due) {
    const center = r.center;
    if (!center) { res.skipped++; continue; }

    // Rəy qəbul etməyən plan (Free/Silver) — dəvət göndərmirik, amma bir daha
    // baxmamaq üçün işarələyirik.
    if (!centerLimits(center.plan).reviews) {
      if (!dryRun) await mark(r.id, null);
      res.skipped++;
      continue;
    }

    const pair = `${center.id}|${r.phone}`;
    if (invitedPairs.has(pair)) {
      // Eyni icrada həmin mərkəz+nömrəyə artıq dəvət getdi.
      if (!dryRun) await mark(r.id, null);
      res.skipped++;
      continue;
    }

    // Pasiyent bu mərkəzə artıq rəy yazıbsa, narahat etmirik. Sorğuda
    // `patientId` boş ola bilər (qonaq rezervasiyası) — o halda nömrə ilə tapırıq.
    const patientId =
      r.patientId ??
      (
        await prisma.user.findUnique({
          where: { phone: r.phone },
          select: { patientProfile: { select: { id: true } } },
        })
      )?.patientProfile?.id ??
      null;

    if (patientId) {
      const has = await prisma.review.findUnique({
        where: { centerId_patientId: { centerId: center.id, patientId } },
        select: { id: true },
      });
      if (has) { if (!dryRun) await mark(r.id, null); res.skipped++; continue; }
    }

    invitedPairs.add(pair);

    res.targets.push({ name: r.name, phone: r.phone, center: center.name });
    if (dryRun) { res.sent++; continue; }

    const token = newReviewToken();
    const sms = await sendSms(r.phone, inviteSms(center.name, token), "review_invite", center.id);
    if (!sms.ok) { res.failed++; continue; } // növbəti icrada yenidən cəhd olunur
    await mark(r.id, token);
    res.sent++;
  }

  return res;
}

async function mark(id: string, token: string | null) {
  await prisma.appointmentRequest.update({
    where: { id },
    data: { reviewInviteSentAt: new Date(), ...(token ? { reviewToken: token } : {}) },
  });
}

export type InviteTarget = {
  requestId: string;
  centerId: string;
  centerSlug: string;
  centerName: string;
  patientName: string;
  patientId: string | null;
  phone: string;
  existing: {
    comment: string | null;
    scoreService: number | null;
    scoreStaff: number | null;
    scoreClean: number | null;
    scoreWait: number | null;
    scorePrice: number | null;
  } | null;
};

/** Token → dəvətin hədəfi. Yanlış/köhnəlmiş token üçün null. */
export async function resolveInvite(token: string): Promise<InviteTarget | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const r = await prisma.appointmentRequest.findUnique({
    where: { reviewToken: token },
    select: {
      id: true, name: true, phone: true, patientId: true, reviewInviteSentAt: true,
      center: { select: { id: true, slug: true, name: true, status: true, plan: true } },
    },
  });
  if (!r?.center || r.center.status !== "APPROVED") return null;
  if (!centerLimits(r.center.plan).reviews) return null;

  // Müddət bitib?
  const sentAt = r.reviewInviteSentAt?.getTime() ?? 0;
  if (Date.now() - sentAt > INVITE_TTL_DAYS * 864e5) return null;

  const existing = r.patientId
    ? await prisma.review.findUnique({
        where: { centerId_patientId: { centerId: r.center.id, patientId: r.patientId } },
        select: {
          comment: true, scoreService: true, scoreStaff: true,
          scoreClean: true, scoreWait: true, scorePrice: true,
        },
      })
    : null;

  return {
    requestId: r.id,
    centerId: r.center.id,
    centerSlug: r.center.slug,
    centerName: r.center.name,
    patientName: r.name,
    patientId: r.patientId,
    phone: r.phone,
    existing,
  };
}
