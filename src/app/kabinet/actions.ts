"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { patientProfileSchema, reviewSchema } from "@/lib/validation";
import { isFlagged } from "@/lib/moderation";
import { centerLimits } from "@/lib/plans";

export type PatientActionResult = { ok: boolean; error?: string; message?: string };

/** Patient self-declares a service was received → unlocks reviewing that center. */
export async function markServiceReceivedAction(
  requestId: string,
): Promise<PatientActionResult> {
  const user = await requireRole("PATIENT");
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) return { ok: false, error: "Profil tapılmadı." };

    const req = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
    });
    if (!req || req.patientId !== profile.id) {
      return { ok: false, error: "Müraciət tapılmadı." };
    }
    if (req.status !== "COMPLETED") {
      await prisma.appointmentRequest.update({
        where: { id: requestId },
        data: { status: "COMPLETED", completedBy: req.completedBy ?? "PATIENT" },
      });
    }
    revalidatePath("/kabinet");
    return {
      ok: true,
      message: "Qeyd olundu. İndi bu mərkəzə rəy yaza bilərsiniz.",
    };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/**
 * Patient edits the arrival time of their own request. Marks it "updated" so
 * the center re-contacts (its contact button re-activates). Not allowed once
 * the request is completed or cancelled.
 */
export async function editRequestTimeAction(
  requestId: string,
  preferredDate: string,
): Promise<PatientActionResult> {
  const user = await requireRole("PATIENT");
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) return { ok: false, error: "Profil tapılmadı." };

    const req = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
      select: { id: true, patientId: true, status: true },
    });
    if (!req || req.patientId !== profile.id) {
      return { ok: false, error: "Müraciət tapılmadı." };
    }
    if (req.status === "COMPLETED" || req.status === "CANCELLED") {
      return { ok: false, error: "Bu müraciətdə dəyişiklik mümkün deyil." };
    }

    const dt = new Date(preferredDate);
    if (Number.isNaN(dt.getTime()) || dt.getTime() < Date.now() - 60 * 60 * 1000) {
      return { ok: false, error: "Düzgün tarix/saat seçin." };
    }

    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: {
        preferredDate: dt,
        patientUpdated: true,
        // If the center had already contacted, revert so the contact button
        // re-activates and the center knows to re-confirm the new time.
        ...(req.status === "CONTACTED" ? { status: "NEW" } : {}),
      },
    });
    revalidatePath("/kabinet");
    revalidatePath("/merkez");
    revalidatePath("/merkez/pasiyentler");
    return { ok: true, message: "Vaxt yeniləndi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/** Patient cancels their own pending request. */
export async function cancelRequestAction(
  requestId: string,
): Promise<PatientActionResult> {
  const user = await requireRole("PATIENT");
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) return { ok: false, error: "Profil tapılmadı." };

    const req = await prisma.appointmentRequest.findUnique({
      where: { id: requestId },
    });
    if (!req || req.patientId !== profile.id) {
      return { ok: false, error: "Müraciət tapılmadı." };
    }
    if (req.status === "COMPLETED" || req.status === "CANCELLED") {
      return { ok: false, error: "Bu müraciəti ləğv etmək olmur." };
    }
    await prisma.appointmentRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/kabinet");
    return { ok: true, message: "Müraciət ləğv edildi." };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function submitReviewAction(input: {
  centerId: string;
  service: number;
  staff: number;
  clean: number;
  wait: number;
  price: number;
  comment?: string;
}): Promise<PatientActionResult> {
  const user = await requireRole("PATIENT");
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;
  const comment = (d.comment || "").trim();
  const vals = [d.service, d.staff, d.clean, d.wait, d.price];
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const flagged = isFlagged(comment);
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) return { ok: false, error: "Profil tapılmadı." };

    // Reviews are a Gold+ plan feature.
    const rc = await prisma.centerProfile.findUnique({
      where: { id: d.centerId },
      select: { plan: true },
    });
    if (!rc || !centerLimits(rc.plan).reviews) {
      return { ok: false, error: "Bu mərkəz rəy qəbul etmir." };
    }

    // Eligibility: a COMPLETED appointment with this center (marked by either side)
    const completed = await prisma.appointmentRequest.findFirst({
      where: { patientId: profile.id, centerId: d.centerId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    });
    if (!completed) {
      return {
        ok: false,
        error: "Yalnız xidmət aldığınız mərkəzə rəy yaza bilərsiniz.",
      };
    }
    const verified = completed.completedBy === "CENTER";

    const data = {
      rating: avg,
      comment: comment || null,
      verified,
      flagged,
      hidden: flagged,
      scoreService: d.service,
      scoreStaff: d.staff,
      scoreClean: d.clean,
      scoreWait: d.wait,
      scorePrice: d.price,
    };

    await prisma.review.upsert({
      where: { centerId_patientId: { centerId: d.centerId, patientId: profile.id } },
      create: { centerId: d.centerId, patientId: profile.id, ...data },
      update: data,
    });

    revalidatePath("/kabinet");
    revalidatePath("/rentgen-merkezleri");
    revalidatePath("/admin/reyler");
    return {
      ok: true,
      message: flagged
        ? "Rəyiniz göndərildi. Moderasiyadan keçdikdən sonra saytda görünəcək."
        : "Rəyiniz üçün təşəkkürlər!",
    };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

export async function savePatientProfileAction(input: {
  firstName: string;
  lastName: string;
  city?: string;
  district?: string;
  birthDate?: string;
}): Promise<PatientActionResult> {
  const user = await requireRole("PATIENT");
  const parsed = patientProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;

  try {
    const birthDate = d.birthDate ? new Date(d.birthDate) : null;
    await prisma.patientProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        firstName: d.firstName,
        lastName: d.lastName,
        city: d.city || null,
        district: d.district || null,
        birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
      },
      update: {
        firstName: d.firstName,
        lastName: d.lastName,
        city: d.city || null,
        district: d.district || null,
        birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
      },
    });
    revalidatePath("/kabinet");
    revalidatePath("/kabinet/profil");
    return { ok: true, message: "Profil yadda saxlanıldı." };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}

export async function toggleFavoriteAction(centerId: string): Promise<PatientActionResult> {
  const user = await requireRole("PATIENT");
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id },
      include: { favoriteCenters: { where: { id: centerId }, select: { id: true } } },
    });
    if (!profile) return { ok: false, error: "Profil tapılmadı." };

    const isFav = profile.favoriteCenters.length > 0;
    await prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        favoriteCenters: isFav
          ? { disconnect: { id: centerId } }
          : { connect: { id: centerId } },
      },
    });
    revalidatePath("/kabinet/secilmisler");
    return { ok: true };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}
