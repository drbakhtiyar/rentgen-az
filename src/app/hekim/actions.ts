"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { doctorProfileSchema } from "@/lib/validation";
import { doctorLimits } from "@/lib/plans";
import { notifyUser } from "@/lib/notifications";
import { alertAdminSms } from "@/lib/sms";
import { doctorName } from "@/lib/utils";

export type DoctorActionResult = { ok: boolean; error?: string; message?: string };

export async function saveDoctorProfileAction(input: {
  firstName: string;
  lastName: string;
  clinic?: string;
  specializations?: string[];
  portfolio?: string[];
  city?: string;
  photoUrl?: string;
  bannerUrl?: string;
  instagram?: string;
  website?: string;
  diplomaUrl?: string;
  certificateUrl?: string;
  residencyUrl?: string;
  internshipUrl?: string;
  specialtyUrl?: string;
  workplaceCenterId?: string;
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

    // Resolve the workplace claim (registered center → needs center confirmation).
    const wcid = input.workplaceCenterId?.trim() || null;
    let workplaceData: {
      workplaceCenterId?: string | null;
      workplaceStatus?: string | null;
    } = {};
    let centerToNotify: { userId: string } | null = null;
    if (!wcid) {
      workplaceData = { workplaceCenterId: null, workplaceStatus: null };
    } else if (
      existing?.workplaceCenterId === wcid &&
      (existing?.workplaceStatus === "ACCEPTED" || existing?.workplaceStatus === "PENDING")
    ) {
      // Same center, already accepted/pending — keep as is, don't re-notify.
      workplaceData = {};
    } else {
      const center = await prisma.centerProfile.findFirst({
        where: { id: wcid, status: "APPROVED" },
        select: { id: true, userId: true },
      });
      if (center) {
        workplaceData = { workplaceCenterId: wcid, workplaceStatus: "PENDING" };
        centerToNotify = { userId: center.userId };
      } else {
        workplaceData = { workplaceCenterId: null, workplaceStatus: null };
      }
    }

    const data = {
      firstName: d.firstName,
      lastName: d.lastName,
      clinic: d.clinic || null,
      specializations: d.specializations ?? [],
      portfolio: doctorLimits(existing?.plan ?? "FREE").portfolio ? (d.portfolio ?? []) : [],
      city: d.city || null,
      photoUrl: d.photoUrl || null,
      // Banner is a Platinum perk; non-eligible plans keep whatever is stored
      // (display is gated separately) instead of silently wiping it.
      bannerUrl: doctorLimits(existing?.plan ?? "FREE").banner
        ? d.bannerUrl || null
        : (existing?.bannerUrl ?? null),
      instagram: d.instagram || null,
      website: d.website || null,
      diplomaUrl: d.diplomaUrl || null,
      certificateUrl: d.certificateUrl || null,
      residencyUrl: d.residencyUrl || null,
      internshipUrl: d.internshipUrl || null,
      specialtyUrl: d.specialtyUrl || null,
      ...workplaceData,
    };

    if (existing) {
      // Completing registration marks the profile as fully onboarded (clears the
      // QR-draft flag so it drops off the incomplete-signups list).
      await prisma.doctorProfile.update({ where: { id: existing.id }, data: { ...data, onboarded: true } });
    } else {
      await prisma.doctorProfile.create({
        data: { ...data, userId: user.id, status: "PENDING", onboarded: true },
      });
      // Alert the admin by SMS that a new doctor awaits approval.
      await alertAdminSms(
        `Rentgen.az: yeni həkim müraciəti təsdiq gözləyir — ${doctorName(d.firstName, d.lastName)}`,
      );
    }

    if (centerToNotify) {
      await notifyUser(
        centerToNotify.userId,
        "WORKPLACE_REQUEST",
        "İş yeri təsdiqi",
        `${doctorName(d.firstName, d.lastName)} sizi iş yeri kimi göstərdi. Təsdiqləyin.`,
        "/merkez/hekimler",
      );
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
