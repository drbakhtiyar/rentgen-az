"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { normalizePhone } from "@/lib/phone";
import { setSessionCookie } from "@/lib/auth/session";
import { isFlagged } from "@/lib/moderation";

export type ReviewActionState = {
  ok: boolean;
  error?: string;
  devCode?: string;
  message?: string;
};

/** Step 1 — send an OTP to the patient's phone for a walk-in (QR) review. */
export async function requestReviewOtpAction(input: {
  phone: string;
}): Promise<ReviewActionState> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };
  try {
    const r = await createOtp(phone);
    if (!r.ok) return { ok: false, error: r.error };
    const sms = await sendOtpSms(phone, r.code);
    if (!sms.ok) return { ok: false, error: "SMS göndərilə bilmədi. Yenidən cəhd edin." };
    return { ok: true, devCode: env.smsProvider === "dev" ? r.code : undefined };
  } catch {
    return { ok: false, error: "Texniki xəta. Bir azdan yenidən cəhd edin." };
  }
}

export type QrScores = {
  service: number;
  staff: number;
  clean: number;
  wait: number;
  price: number;
};

/** Step 2 — verify the OTP, create the review, auto-create + log in the patient. */
export async function submitQrReviewAction(input: {
  centerSlug: string;
  firstName: string;
  lastName: string;
  phone: string;
  code: string;
  doctorId?: string;
  doctorName?: string;
  scores: QrScores;
  comment?: string;
}): Promise<ReviewActionState> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };
  const first = input.firstName.trim();
  const last = input.lastName.trim();
  if (first.length < 2 || last.length < 2) {
    return { ok: false, error: "Ad və soyad tələb olunur." };
  }
  const s = input.scores;
  const vals = [s.service, s.staff, s.clean, s.wait, s.price];
  if (vals.some((v) => !Number.isInteger(v) || v < 1 || v > 5)) {
    return { ok: false, error: "Bütün suallara ulduz verin." };
  }
  const comment = (input.comment ?? "").trim().slice(0, 1000);

  // Verify OTP first — this consumes the code.
  const v = await verifyOtp(phone, input.code.trim());
  if (!v.ok) return { ok: false, error: v.error };

  try {
    const center = await prisma.centerProfile.findFirst({
      where: { slug: input.centerSlug, status: "APPROVED" },
      select: { id: true },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    // Auto-create (or reuse) the patient account, filling missing names.
    const include = { patientProfile: true } as const;
    let user = await prisma.user.findUnique({ where: { phone }, include });
    if (user?.isBlocked) return { ok: false, error: "Bu hesab bloklanıb." };
    if (user?.role === "ADMIN") {
      return { ok: false, error: "Bu nömrə ilə rəy yazmaq mümkün deyil." };
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          role: "PATIENT",
          lastLoginAt: new Date(),
          patientProfile: { create: { firstName: first, lastName: last } },
        },
        include,
      });
    } else {
      if (!user.patientProfile) {
        await prisma.patientProfile.create({
          data: { userId: user.id, firstName: first, lastName: last },
        });
      } else {
        await prisma.patientProfile.update({
          where: { id: user.patientProfile.id },
          data: {
            firstName: user.patientProfile.firstName || first,
            lastName: user.patientProfile.lastName || last,
          },
        });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      user = await prisma.user.findUnique({ where: { id: user.id }, include });
    }
    const patientId = user!.patientProfile!.id;

    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const flagged = isFlagged(comment);

    const data = {
      rating: avg,
      comment: comment || null,
      verified: true, // OTP + walk-in → "təsdiqlənmiş müştəri"
      source: "qr",
      flagged,
      hidden: flagged, // profane comments wait for admin approval
      scoreService: s.service,
      scoreStaff: s.staff,
      scoreClean: s.clean,
      scoreWait: s.wait,
      scorePrice: s.price,
      doctorId: input.doctorId?.trim() || null,
      doctorName: input.doctorName?.trim() || null,
    };

    await prisma.review.upsert({
      where: { centerId_patientId: { centerId: center.id, patientId } },
      create: { centerId: center.id, patientId, ...data },
      update: data,
    });

    // Auto-login the patient (their own device).
    await setSessionCookie({ userId: user!.id, role: "PATIENT", phone });

    revalidatePath(`/rentgen-merkezleri/${input.centerSlug}`);
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
