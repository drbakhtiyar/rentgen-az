"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { normalizePhone } from "@/lib/phone";
import { requireRole } from "@/lib/auth/rbac";
import { centerLimits } from "@/lib/plans";
import { notifyNewAppointment, smsCenterBooking, smsPatientBooking } from "@/lib/notify";
import { isPreferredDateAvailable } from "@/lib/crm";
import { notifyUser } from "@/lib/notifications";
import { doctorName } from "@/lib/utils";

export type ReferralResult = {
  ok: boolean;
  error?: string;
  message?: string;
  devCode?: string;
};

/** Step 1: send an OTP to the patient's phone to confirm the referral. */
export async function requestReferralOtpAction(input: {
  phone: string;
}): Promise<ReferralResult> {
  await requireRole("DOCTOR");
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Pasiyentin nömrəsi düzgün deyil." };
  try {
    const r = await createOtp(phone);
    if (!r.ok) return { ok: false, error: r.error };
    const sms = await sendOtpSms(phone, r.code);
    if (!sms.ok) return { ok: false, error: "SMS göndərilə bilmədi. Yenidən cəhd edin." };
    return { ok: true, devCode: env.smsProvider === "dev" ? r.code : undefined };
  } catch {
    return { ok: false, error: "Texniki xəta." };
  }
}

/**
 * Step 2: verify the patient OTP, then create the referral (an appointment
 * request attributed to this doctor + selected partner center) and
 * auto-create the patient account. The doctor stays logged in as a doctor.
 */
export async function submitDoctorReferralAction(input: {
  centerId: string;
  serviceSlug: string;
  patientFirstName: string;
  patientLastName: string;
  phone: string;
  code: string;
  note?: string;
  preferredDate?: string;
  /** QR-originated referral: the center invited the doctor via its own QR. */
  invited?: boolean;
  /** For a first-time doctor with no profile yet (collected in the form). */
  doctorFirstName?: string;
  doctorLastName?: string;
}): Promise<ReferralResult> {
  const user = await requireRole("DOCTOR");
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Pasiyentin nömrəsi düzgün deyil." };
  // Optional preferred date (referral date is not required).
  let preferredDate: Date | null = null;
  if (input.preferredDate) {
    const dt = new Date(input.preferredDate);
    if (!Number.isNaN(dt.getTime()) && dt.getTime() > Date.now() - 60 * 60 * 1000) {
      preferredDate = dt;
    }
  }
  const first = input.patientFirstName.trim();
  const last = input.patientLastName.trim();
  if (first.length < 2 || last.length < 2) {
    return { ok: false, error: "Pasiyentin adı və soyadı tələb olunur." };
  }
  if (!input.centerId) return { ok: false, error: "Mərkəz seçin." };

  try {
    const center = await prisma.centerProfile.findUnique({
      where: { id: input.centerId },
      select: { id: true, name: true, slug: true, phone: true, userId: true, plan: true },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
    if (!centerLimits(center.plan).receivesReferrals) {
      return { ok: false, error: "Bu mərkəz həkim yönləndirmələrini qəbul etmir (Gold/Platinum paket lazımdır)." };
    }

    // No double booking: reject if the chosen time is already taken.
    if (preferredDate) {
      const free = await isPreferredDateAvailable(
        center.id,
        preferredDate,
        input.serviceSlug || null,
      ).catch(() => true);
      if (!free) {
        return { ok: false, error: "Seçdiyiniz vaxt artıq doludur. Başqa vaxt seçin." };
      }
    }

    let doctor = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, status: true, firstName: true, lastName: true, onboarded: true },
    });

    if (input.invited) {
      // Invited via the center's QR: create a minimal draft profile if the doctor
      // has none, and auto-establish the partnership (the center consented by
      // handing out its QR). Approval is NOT required for invited referrals.
      if (!doctor) {
        const df = (input.doctorFirstName ?? "").trim();
        const dl = (input.doctorLastName ?? "").trim();
        if (df.length < 2 || dl.length < 2) {
          return { ok: false, error: "Ad və soyadınızı yazın." };
        }
        doctor = await prisma.doctorProfile.create({
          data: { userId: user.id, firstName: df, lastName: dl, status: "PENDING", onboarded: false },
          select: { id: true, status: true, firstName: true, lastName: true, onboarded: true },
        });
      }
      await prisma.centerDoctor.upsert({
        where: { centerId_doctorId: { centerId: center.id, doctorId: doctor.id } },
        create: { centerId: center.id, doctorId: doctor.id, status: "ACCEPTED" },
        update: {},
      });
    } else {
      if (!doctor) return { ok: false, error: "Həkim profili tapılmadı." };
      // The doctor must be an accepted partner of this center.
      const partner = await prisma.centerDoctor.findUnique({
        where: { centerId_doctorId: { centerId: center.id, doctorId: doctor.id } },
        select: { status: true },
      });
      if (partner?.status !== "ACCEPTED") {
        return { ok: false, error: "Yalnız partnyor mərkəzlərinizə göndəriş edə bilərsiniz." };
      }
    }

    // Verify the patient's OTP.
    const v = await verifyOtp(phone, input.code.trim());
    if (!v.ok) return { ok: false, error: v.error };

    // Create or reuse the patient account (do NOT change the doctor's session).
    const existing = await prisma.user.findUnique({
      where: { phone },
      include: { patientProfile: true },
    });
    let patientId: string | null = null;
    if (existing?.isBlocked) return { ok: false, error: "Bu hesab bloklanıb." };
    if (existing && existing.role === "ADMIN") {
      patientId = null;
    } else if (!existing) {
      const created = await prisma.user.create({
        data: {
          phone,
          role: "PATIENT",
          patientProfile: { create: { firstName: first, lastName: last } },
        },
        include: { patientProfile: true },
      });
      patientId = created.patientProfile!.id;
    } else {
      let pp = existing.patientProfile;
      if (!pp) {
        pp = await prisma.patientProfile.create({
          data: { userId: existing.id, firstName: first, lastName: last },
        });
      } else if (!pp.firstName || !pp.lastName) {
        pp = await prisma.patientProfile.update({
          where: { id: pp.id },
          data: { firstName: pp.firstName || first, lastName: pp.lastName || last },
        });
      }
      patientId = pp.id;
    }

    await prisma.appointmentRequest.create({
      data: {
        name: `${first} ${last}`.trim(),
        phone,
        centerId: center.id,
        doctorId: doctor.id,
        serviceSlug: input.serviceSlug || null,
        note: input.note?.trim() || null,
        preferredDate,
        patientId,
      },
    });

    // Notify the center (best-effort).
    await notifyNewAppointment({
      name: `${first} ${last}`.trim(),
      phone,
      centerName: center.name,
      centerSlug: center.slug,
      serviceSlug: input.serviceSlug || null,
      note: input.note?.trim() || null,
    }).catch(() => {});

    const patientFullName = `${first} ${last}`.trim();
    const docName = doctorName(doctor.firstName, doctor.lastName);
    const svc = input.serviceSlug
      ? await prisma.service
          .findUnique({ where: { slug: input.serviceSlug }, select: { name: true } })
          .catch(() => null)
      : null;
    // Booking summary SMS (date/time included if the doctor picked one).
    if (center.phone) {
      await smsCenterBooking(center.phone, {
        patientName: patientFullName,
        patientPhone: phone,
        doctorName: docName,
        dateTime: preferredDate,
        serviceName: svc?.name ?? null,
      }).catch(() => {});
    }
    await smsPatientBooking(phone, {
      patientName: patientFullName,
      doctorName: docName,
      dateTime: preferredDate,
      serviceName: svc?.name ?? null,
      centerPhone: center.phone,
    }).catch(() => {});
    // In-app notification for the center.
    await notifyUser(
      center.userId,
      "NEW_REQUEST",
      "Yeni pasiyent göndərişi",
      `Həkim ${first} ${last} pasiyentini yönləndirdi.`,
      "/merkez/pasiyentler",
    );

    // A QR-invited doctor whose registration isn't finished — nudge the center
    // to help them complete it (also visible in admin's incomplete-signups list).
    if (input.invited && doctor && doctor.onboarded === false) {
      await notifyUser(
        center.userId,
        "NEW_REQUEST",
        "Yeni həkim sizə göndəriş etdi",
        `${docName} sizə pasiyent göndərdi, amma qeydiyyatını hələ tamamlamayıb. Onunla əlaqə saxlayıb tamamlamağa kömək edə bilərsiniz.`,
        "/merkez/hekimler",
      ).catch(() => {});
    }

    revalidatePath("/hekim");
    revalidatePath("/merkez");
    return { ok: true, message: "Göndəriş tamamlandı. Mərkəz pasiyentlə əlaqə saxlayacaq." };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
