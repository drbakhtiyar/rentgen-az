"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { patientProfileSchema, reviewSchema } from "@/lib/validation";

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

export async function submitReviewAction(input: {
  centerId: string;
  rating: number;
  comment?: string;
}): Promise<PatientActionResult> {
  const user = await requireRole("PATIENT");
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) return { ok: false, error: "Profil tapılmadı." };

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

    await prisma.review.upsert({
      where: { centerId_patientId: { centerId: d.centerId, patientId: profile.id } },
      create: {
        centerId: d.centerId,
        patientId: profile.id,
        rating: d.rating,
        comment: d.comment || null,
        verified,
      },
      update: { rating: d.rating, comment: d.comment || null, verified },
    });

    revalidatePath("/kabinet");
    revalidatePath("/rentgen-merkezleri");
    return { ok: true, message: "Rəyiniz üçün təşəkkürlər!" };
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
