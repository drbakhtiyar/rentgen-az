"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { doctorProfileSchema } from "@/lib/validation";

export type DoctorActionResult = { ok: boolean; error?: string; message?: string };

export async function saveDoctorProfileAction(input: {
  firstName: string;
  lastName: string;
  clinic?: string;
  specialization?: string;
  city?: string;
}): Promise<DoctorActionResult> {
  const user = await requireRole("DOCTOR");
  const parsed = doctorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const d = parsed.data;

  try {
    const existing = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
    });

    const data = {
      firstName: d.firstName,
      lastName: d.lastName,
      clinic: d.clinic || null,
      specialization: d.specialization || null,
      city: d.city || null,
    };

    if (existing) {
      await prisma.doctorProfile.update({ where: { id: existing.id }, data });
    } else {
      await prisma.doctorProfile.create({
        data: { ...data, userId: user.id, status: "PENDING" },
      });
    }

    revalidatePath("/hekim");
    revalidatePath("/hekim/profil");
    return {
      ok: true,
      message: existing
        ? "Profil yeniləndi."
        : "Profil yaradıldı. Admin təsdiqindən sonra pasiyentlərin siyahısında görünəcəksiniz.",
    };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
