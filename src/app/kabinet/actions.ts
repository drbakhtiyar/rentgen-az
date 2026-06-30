"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { patientProfileSchema } from "@/lib/validation";

export type PatientActionResult = { ok: boolean; error?: string; message?: string };

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
