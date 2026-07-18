"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { doctorProfileSchema } from "@/lib/validation";
import { doctorLimits } from "@/lib/plans";
import { notifyUser } from "@/lib/notifications";
import { alertAdminSms, sendOtpSms } from "@/lib/sms";
import { createOtp, verifyOtp } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";
import { env } from "@/lib/env";
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

// ---------------- Assistant management (doctor = owner only) ----------------

export type AssistantResult = { ok: boolean; error?: string; devCode?: string };

/** The doctor's own profile — assistants can't manage assistants. */
async function ownerDoctor() {
  const user = await requireRole("DOCTOR");
  return prisma.doctorProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
}

/** Step 1 of adding an assistant: validate the phone and send an OTP to it. */
export async function startAddDoctorAssistantAction(input: {
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<AssistantResult> {
  const doctor = await ownerDoctor();
  if (!doctor) return { ok: false, error: "Həkim profili tapılmadı." };
  if (input.firstName.trim().length < 2 || input.lastName.trim().length < 2) {
    return { ok: false, error: "Asistentin adı və soyadı tələb olunur." };
  }
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };

  const existing = await prisma.user.findUnique({
    where: { phone },
    select: {
      role: true,
      centerProfile: { select: { id: true } },
      doctorProfile: { select: { id: true } },
      assistantOf: { select: { centerId: true } },
      doctorAssistantOf: { select: { doctorId: true } },
    },
  });
  if (existing?.centerProfile || existing?.doctorProfile || existing?.role === "ADMIN") {
    return { ok: false, error: "Bu nömrə mərkəz/həkim/admin hesabına bağlıdır — asistent ola bilməz." };
  }
  if (existing?.assistantOf) {
    return { ok: false, error: "Bu nömrə artıq bir mərkəzin asistentidir." };
  }
  if (existing?.doctorAssistantOf && existing.doctorAssistantOf.doctorId !== doctor.id) {
    return { ok: false, error: "Bu nömrə artıq başqa həkimin asistentidir." };
  }
  // One assistant per doctor (re-verifying the same phone is allowed).
  const others = await prisma.doctorAssistant.count({
    where: { doctorId: doctor.id, user: { phone: { not: phone } } },
  });
  if (others > 0) {
    return { ok: false, error: "Hər həkimə maksimum 1 asistent əlavə etmək olar." };
  }

  const r = await createOtp(phone);
  if (!r.ok) return { ok: false, error: r.error };
  const sms = await sendOtpSms(phone, r.code);
  if (!sms.ok) return { ok: false, error: "SMS göndərilə bilmədi. Yenidən cəhd edin." };
  return { ok: true, devCode: env.smsProvider === "dev" ? r.code : undefined };
}

/** Step 2: verify the OTP and create/activate the assistant. */
export async function confirmAddDoctorAssistantAction(input: {
  firstName: string;
  lastName: string;
  phone: string;
  code: string;
}): Promise<AssistantResult> {
  const doctor = await ownerDoctor();
  if (!doctor) return { ok: false, error: "Həkim profili tapılmadı." };
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };
  const v = await verifyOtp(phone, input.code.trim());
  if (!v.ok) return { ok: false, error: v.error };
  const others = await prisma.doctorAssistant.count({
    where: { doctorId: doctor.id, user: { phone: { not: phone } } },
  });
  if (others > 0) {
    return { ok: false, error: "Hər həkimə maksimum 1 asistent əlavə etmək olar." };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const user =
    (await prisma.user.findUnique({ where: { phone }, select: { id: true } })) ??
    (await prisma.user.create({ data: { phone, role: "ASSISTANT" }, select: { id: true } }));

  await prisma.doctorAssistant.upsert({
    where: { userId: user.id },
    create: { userId: user.id, doctorId: doctor.id, firstName, lastName },
    update: { firstName, lastName, active: true },
  });

  revalidatePath("/hekim/profil");
  return { ok: true };
}

/** Activate / deactivate the assistant (deactivated ones can't log in). */
export async function setDoctorAssistantActiveAction(id: string, active: boolean): Promise<DoctorActionResult> {
  const doctor = await ownerDoctor();
  if (!doctor) return { ok: false, error: "Həkim profili tapılmadı." };
  const link = await prisma.doctorAssistant.findUnique({ where: { id }, select: { doctorId: true } });
  if (!link || link.doctorId !== doctor.id) return { ok: false, error: "Asistent tapılmadı." };
  await prisma.doctorAssistant.update({ where: { id }, data: { active } });
  revalidatePath("/hekim/profil");
  return { ok: true };
}

/** Remove the assistant entirely (their login stops working immediately). */
export async function removeDoctorAssistantAction(id: string): Promise<DoctorActionResult> {
  const doctor = await ownerDoctor();
  if (!doctor) return { ok: false, error: "Həkim profili tapılmadı." };
  const link = await prisma.doctorAssistant.findUnique({ where: { id }, select: { doctorId: true } });
  if (!link || link.doctorId !== doctor.id) return { ok: false, error: "Asistent tapılmadı." };
  await prisma.doctorAssistant.delete({ where: { id } });
  revalidatePath("/hekim/profil");
  return { ok: true };
}
