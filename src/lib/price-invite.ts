import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/env";
import { AZ_MOBILE_PREFIXES } from "@/lib/center-filters";

/**
 * Qiymət toplama kampaniyası — WhatsApp üzərindən.
 *
 * AXIN: operator `/panel/whatsapp` səhifəsində günlük partiyanı görür →
 * "WhatsApp aç" düyməsi `wa.me` linkini hazır mətnlə açır (mətndə mərkəzin
 * adı + onun `/q/<token>` linki) → operator "göndər"ə basır → sistem göndərişi
 * jurnala yazır. Mərkəz linki açıb girişsiz qiymətlərini yazır.
 *
 * NİYƏ OTP YOXDUR: linki BİZ mərkəzin öz nömrəsinə göndəririk — token
 * sahibliyi sübut edir (rəy dəvətindəki eyni məntiq). Səhifədə şəxsi məlumat
 * yoxdur; edilə bilən yeganə şey öz kartının qiymətini yazmaqdır və hər
 * dəyişiklik jurnala düşür.
 *
 * NİYƏ GÜNDƏ 12: tanımadığın nömrələrə kütləvi eyni-mətnli mesaj WhatsApp-ın
 * spam siqnalıdır; aşağı temp + variantlı mətn + ikitərəfli söhbət nömrəni
 * qoruyur (istifadəçi qərarı, 2026-08-03). Limit alətə tikilib ki, operator
 * qaydanı bilmədən də poza bilməsin.
 */

/** Gündəlik WhatsApp göndəriş limiti (istifadəçi qərarı: 12). */
export const WA_DAILY_LIMIT = 12;
/** Jurnalda göndəriş qeydinin `action` açarı. */
export const WA_LOG_ACTION = "center:wa_price_invite";

const mobileOr = AZ_MOBILE_PREFIXES.map((p) => ({ whatsapp: { startsWith: p } }));
const mobilePhoneOr = AZ_MOBILE_PREFIXES.map((p) => ({ phone: { startsWith: p } }));

/** Bakı günü üzrə bugünün başlanğıcı (UTC+4). */
export function bakuDayStart(now = new Date()): Date {
  const baku = new Date(now.getTime() + 4 * 3600_000);
  baku.setUTCHours(0, 0, 0, 0);
  return new Date(baku.getTime() - 4 * 3600_000);
}

/** Bu gün neçə göndəriş olub. */
export async function sentToday(): Promise<number> {
  return prisma.adminActionLog.count({
    where: { action: WA_LOG_ACTION, createdAt: { gte: bakuDayStart() } },
  });
}

export type WaCandidate = {
  centerId: string;
  name: string;
  city: string | null;
  status: string;
  waPhone: string;
  waUrl: string;
  qUrl: string;
  googleReviewCount: number | null;
};

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** Mesaj mətni — variantlı (eyni cümlə yüzlərlə nömrəyə getməsin). */
export function waMessage(centerName: string, qUrl: string, seed: string): string {
  const V = [
    `Salam! ${centerName} — rentgen.az kataloqunda səhifəniz var. Qiymətlərinizi əlavə etsəniz, pasiyentlər sizi qiymətə görə də tapacaq. 1 dəqiqə çəkir: ${qUrl}`,
    `Salam, ${centerName}! Biz rentgen.az-ıq — Azərbaycanın rentgen/diaqnostika kataloqu. Xidmət qiymətlərinizi bu linkdən qeyd edə bilərsiniz (girişsiz, 1 dəqiqə): ${qUrl}`,
    `Salam! rentgen.az-da ${centerName} səhifəsinə pasiyentlər baxır. Qiymətləri göstərsək, müraciət sayı artır. Qeyd etmək üçün: ${qUrl}`,
    `Salam, ${centerName}! rentgen.az kataloqunda qiyməti göstərilən mərkəzlər axtarışda önə çıxır. Qiymətlərinizi bura yaza bilərsiniz: ${qUrl}`,
    `Salam! ${centerName} üçün rentgen.az-da qiymət bölməsi hazırladıq — doldurmaq 1 dəqiqə çəkir, giriş tələb olunmur: ${qUrl}`,
  ];
  return V[hash(seed) % V.length];
}

/** Mərkəzin tokenini qaytarır, yoxdursa yaradır. */
export async function ensurePriceToken(centerId: string): Promise<string> {
  const c = await prisma.centerProfile.findUnique({ where: { id: centerId }, select: { priceToken: true } });
  if (c?.priceToken) return c.priceToken;
  const token = randomBytes(16).toString("hex");
  await prisma.centerProfile.update({ where: { id: centerId }, data: { priceToken: token } });
  return token;
}

/**
 * Bugünkü partiya: qiyməti OLMAYAN, mobil WhatsApp/telefonu OLAN, hələ
 * GÖNDƏRİLMƏMİŞ mərkəzlər. APPROVED əvvəl (qiymət dərhal canlıda görünür),
 * sonra PENDING; hər qrupda böyüklər (Google rəy sayı) əvvəl.
 */
export async function todaysBatch(): Promise<{ remaining: number; candidates: WaCandidate[] }> {
  const used = await sentToday();
  const remaining = Math.max(0, WA_DAILY_LIMIT - used);

  const alreadySent = await prisma.adminActionLog.findMany({
    where: { action: WA_LOG_ACTION },
    select: { targetId: true },
  });
  const sentIds = new Set(alreadySent.map((l) => l.targetId).filter(Boolean));

  const centers = await prisma.centerProfile.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      OR: [...mobileOr, ...mobilePhoneOr],
      services: { some: {} },
      NOT: { services: { some: { price: { not: null } } } },
    },
    select: {
      id: true, name: true, city: true, status: true, phone: true, whatsapp: true,
      googleReviewCount: true, priceToken: true,
    },
  });

  const isMobile = (p: string | null) => !!p && AZ_MOBILE_PREFIXES.some((x) => p.startsWith(x));
  const pool = centers
    .filter((c) => !sentIds.has(c.id))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "APPROVED" ? -1 : 1;
      return (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0);
    })
    .slice(0, remaining);

  const candidates: WaCandidate[] = [];
  for (const c of pool) {
    const waPhone = isMobile(c.whatsapp) ? c.whatsapp! : c.phone;
    const token = c.priceToken ?? (await ensurePriceToken(c.id));
    const qUrl = `${SITE_URL}/q/${token}`;
    const msg = waMessage(c.name, qUrl, c.id);
    candidates.push({
      centerId: c.id, name: c.name, city: c.city, status: c.status,
      waPhone, qUrl,
      waUrl: `https://wa.me/${waPhone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
      googleReviewCount: c.googleReviewCount,
    });
  }
  return { remaining, candidates };
}

export type PriceTarget = {
  centerId: string;
  centerName: string;
  slug: string;
  rows: { centerServiceId: string; serviceName: string; category: string | null; price: number | null }[];
};

/** Token → mərkəz + xidmət sətirləri (qiymət formu üçün). */
export async function resolvePriceToken(token: string): Promise<PriceTarget | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const c = await prisma.centerProfile.findUnique({
    where: { priceToken: token },
    select: {
      id: true, name: true, slug: true, status: true,
      services: {
        select: { id: true, price: true, service: { select: { name: true, category: true, featured: true, order: true } } },
        orderBy: { service: { order: "asc" } },
      },
    },
  });
  if (!c || c.status === "DEACTIVATED") return null;
  const rows = [...c.services]
    .sort((a, b) => Number(b.service.featured) - Number(a.service.featured))
    .map((s) => ({ centerServiceId: s.id, serviceName: s.service.name, category: s.service.category, price: s.price }));
  return { centerId: c.id, centerName: c.name, slug: c.slug, rows };
}
