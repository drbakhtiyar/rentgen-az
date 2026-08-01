"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isFlagged } from "@/lib/moderation";
import { resolveInvite } from "@/lib/review-invite";

export type InviteReviewState = { ok: boolean; error?: string; message?: string };

export type InviteScores = {
  service: number;
  staff: number;
  clean: number;
  wait: number;
  price: number;
};

/**
 * Dəvət linki ilə rəy göndərmək.
 *
 * OTP yoxdur — tokenin özü sahibliyi sübut edir (linki məhz sorğudakı nömrəyə
 * biz göndərmişik). Bax `src/lib/review-invite.ts`.
 */
export async function submitInviteReviewAction(input: {
  token: string;
  scores: InviteScores;
  comment?: string;
}): Promise<InviteReviewState> {
  const target = await resolveInvite(input.token).catch(() => null);
  if (!target) {
    return { ok: false, error: "Bu link artıq keçərli deyil." };
  }

  const s = input.scores;
  const vals = [s.service, s.staff, s.clean, s.wait, s.price];
  if (vals.some((v) => !Number.isInteger(v) || v < 1 || v > 5)) {
    return { ok: false, error: "Bütün suallara ulduz verin." };
  }
  const comment = (input.comment ?? "").trim().slice(0, 1000);

  try {
    // Qonaq sorğusunda pasiyent hesabı olmaya bilər — rəy üçün lazımdır.
    let patientId = target.patientId;
    if (!patientId) {
      const parts = target.patientName.trim().split(/\s+/);
      const user = await prisma.user.upsert({
        where: { phone: target.phone },
        create: {
          phone: target.phone,
          role: "PATIENT",
          patientProfile: {
            create: { firstName: parts[0] ?? null, lastName: parts.slice(1).join(" ") || null },
          },
        },
        update: {},
        include: { patientProfile: true },
      });
      if (user.isBlocked) return { ok: false, error: "Bu hesab bloklanıb." };
      patientId =
        user.patientProfile?.id ??
        (
          await prisma.patientProfile.create({
            data: {
              userId: user.id,
              firstName: parts[0] ?? null,
              lastName: parts.slice(1).join(" ") || null,
            },
          })
        ).id;
      // Sorğunu da pasiyentə bağlayaq ki, kabinetdə görünsün.
      await prisma.appointmentRequest
        .update({ where: { id: target.requestId }, data: { patientId } })
        .catch(() => null);
    }

    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const flagged = isFlagged(comment);

    const data = {
      rating: avg,
      comment: comment || null,
      // Dəvət YALNIZ tamamlanmış real müayinədən sonra gedir — ən güclü təsdiq.
      verified: true,
      source: "invite",
      flagged,
      hidden: flagged,
      scoreService: s.service,
      scoreStaff: s.staff,
      scoreClean: s.clean,
      scoreWait: s.wait,
      scorePrice: s.price,
    };

    await prisma.review.upsert({
      where: { centerId_patientId: { centerId: target.centerId, patientId } },
      create: { centerId: target.centerId, patientId, ...data },
      update: data,
    });

    revalidatePath(`/rentgen-merkezleri/${target.centerSlug}`);
    revalidatePath("/admin/reyler");
    return {
      ok: true,
      message: flagged
        ? "Rəyiniz göndərildi. Moderasiyadan keçdikdən sonra saytda görünəcək."
        : "Rəyiniz üçün təşəkkürlər!",
    };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
