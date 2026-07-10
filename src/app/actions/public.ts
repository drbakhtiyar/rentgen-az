"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { centerLimits } from "@/lib/plans";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { setSessionCookie } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/rbac";
import {
  appointmentRequestSchema,
  referralSchema,
  waitlistSignupSchema,
} from "@/lib/validation";
import {
  notifyNewAppointment,
  notifyNewReferral,
  smsCenterBooking,
  smsPatientBooking,
} from "@/lib/notify";
import { notifyUser } from "@/lib/notifications";
import { doctorName } from "@/lib/utils";

export type FormResult = {
  ok: boolean;
  error?: string;
  message?: string;
  devCode?: string;
};

/** Step 1 for guests: send an OTP to verify the phone before booking. */
export async function requestAppointmentOtpAction(input: {
  phone: string;
}): Promise<FormResult> {
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

export async function submitAppointmentAction(input: {
  name: string;
  phone: string;
  centerId?: string;
  doctorId?: string;
  serviceSlug?: string;
  note?: string;
  preferredDate?: string;
  /** OTP code — required for guests (not logged-in patients). */
  code?: string;
}): Promise<FormResult> {
  const parsed = appointmentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const data = parsed.data;

  try {
    const user = await getCurrentUser();
    const loggedInPatient =
      user?.role === "PATIENT" ? user.patientProfile ?? null : null;
    let patientId = loggedInPatient?.id ?? null;

    // Light anti-spam: max 5 requests per phone per hour
    const phone = normalizePhone(data.phone) ?? data.phone;
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.appointmentRequest.count({
      where: { phone, createdAt: { gte: hourAgo } },
    });
    if (recent >= 5) {
      return {
        ok: false,
        error: "Çox sayda müraciət göndərilib. Bir saatdan sonra cəhd edin.",
      };
    }

    // Guests must verify an OTP. This also auto-creates + logs in a patient
    // account (or reuses an existing one for a repeat phone).
    if (!loggedInPatient) {
      if (!input.code) {
        return { ok: false, error: "Təsdiq kodu tələb olunur." };
      }
      const v = await verifyOtp(phone, input.code.trim());
      if (!v.ok) return { ok: false, error: v.error };

      const parts = data.name.trim().split(/\s+/);
      const first = parts[0] ?? "";
      const last = parts.slice(1).join(" ");

      const existing = await prisma.user.findUnique({
        where: { phone },
        include: { patientProfile: true },
      });
      if (existing?.isBlocked) {
        return { ok: false, error: "Bu hesab bloklanıb." };
      }
      if (existing && existing.role === "ADMIN") {
        // Admin phone — record the request but don't touch the admin session.
        patientId = null;
      } else if (!existing) {
        const created = await prisma.user.create({
          data: {
            phone,
            role: "PATIENT",
            lastLoginAt: new Date(),
            patientProfile: { create: { firstName: first, lastName: last } },
          },
          include: { patientProfile: true },
        });
        patientId = created.patientProfile!.id;
        await setSessionCookie({ userId: created.id, role: "PATIENT", phone });
      } else {
        // Existing (non-admin) account — attach to its patient profile.
        let pp = existing.patientProfile;
        if (!pp) {
          pp = await prisma.patientProfile.create({
            data: { userId: existing.id, firstName: first, lastName: last },
          });
        } else if (!pp.firstName || !pp.lastName) {
          pp = await prisma.patientProfile.update({
            where: { id: pp.id },
            data: {
              firstName: pp.firstName || first || null,
              lastName: pp.lastName || last || null,
            },
          });
        }
        patientId = pp.id;
        await prisma.user.update({
          where: { id: existing.id },
          data: { lastLoginAt: new Date() },
        });
        await setSessionCookie({ userId: existing.id, role: "PATIENT", phone });
      }
    }

    // Plan-based monthly request cap (Free centers = 25/month).
    if (data.centerId) {
      const c = await prisma.centerProfile.findUnique({
        where: { id: data.centerId },
        select: { plan: true },
      });
      const limit = c ? centerLimits(c.plan).monthlyRequests : null;
      if (limit != null) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const used = await prisma.appointmentRequest.count({
          where: { centerId: data.centerId, createdAt: { gte: monthStart } },
        });
        if (used >= limit) {
          return {
            ok: false,
            error: "Bu mərkəz bu ay üçün müraciət limitinə çatıb. Zəhmət olmasa birbaşa əlaqə saxlayın.",
          };
        }
      }
    }

    let preferredDate: Date | null = null;
    if (data.preferredDate) {
      const dt = new Date(data.preferredDate);
      if (!Number.isNaN(dt.getTime()) && dt.getTime() > Date.now() - 60 * 60 * 1000) {
        preferredDate = dt;
      }
    }

    await prisma.appointmentRequest.create({
      data: {
        name: data.name,
        phone,
        centerId: data.centerId || null,
        doctorId: data.doctorId || null,
        serviceSlug: data.serviceSlug || null,
        note: data.note || null,
        preferredDate,
        patientId,
      },
    });

    // Backfill a logged-in patient's profile name if it was incomplete.
    if (loggedInPatient && (!loggedInPatient.firstName || !loggedInPatient.lastName)) {
      const parts = data.name.trim().split(/\s+/);
      const first = parts[0] ?? "";
      const last = parts.slice(1).join(" ");
      await prisma.patientProfile
        .update({
          where: { id: loggedInPatient.id },
          data: {
            firstName: loggedInPatient.firstName || first || null,
            lastName: loggedInPatient.lastName || last || null,
          },
        })
        .then(() => revalidatePath("/kabinet"))
        .catch(() => {});
    }

    // Notify (best-effort — never block the patient's submission)
    const center = data.centerId
      ? await prisma.centerProfile
          .findUnique({
            where: { id: data.centerId },
            select: { name: true, slug: true, phone: true, userId: true },
          })
          .catch(() => null)
      : null;
    await notifyNewAppointment({
      name: data.name,
      phone,
      centerName: center?.name,
      centerSlug: center?.slug,
      serviceSlug: data.serviceSlug || null,
      note: data.note || null,
    }).catch(() => {});

    // Resolve doctor + service names for the booking summary SMS.
    const [refDoctor, svc] = await Promise.all([
      data.doctorId
        ? prisma.doctorProfile
            .findUnique({ where: { id: data.doctorId }, select: { firstName: true, lastName: true } })
            .catch(() => null)
        : Promise.resolve(null),
      data.serviceSlug
        ? prisma.service
            .findUnique({ where: { slug: data.serviceSlug }, select: { name: true } })
            .catch(() => null)
        : Promise.resolve(null),
    ]);
    const docName = refDoctor ? doctorName(refDoctor.firstName, refDoctor.lastName) : null;
    const serviceName = svc?.name ?? null;

    // Booking summary SMS to the center (with the patient's phone).
    if (center?.phone) {
      await smsCenterBooking(center.phone, {
        patientName: data.name,
        patientPhone: phone,
        doctorName: docName,
        dateTime: preferredDate,
        serviceName,
      }).catch(() => {});
    }
    // Booking summary SMS to the patient (with the center's phone).
    await smsPatientBooking(phone, {
      patientName: data.name,
      doctorName: docName,
      dateTime: preferredDate,
      serviceName,
      centerPhone: center?.phone,
    }).catch(() => {});
    // In-app notification for the center.
    await notifyUser(
      center?.userId,
      "NEW_REQUEST",
      "Yeni pasiyent müraciəti",
      `${data.name} sizə müraciət etdi.`,
      "/merkez/pasiyentler",
    );

    return {
      ok: true,
      message: "Müraciətiniz göndərildi. Mərkəz tezliklə sizinlə əlaqə saxlayacaq.",
    };
  } catch {
    return { ok: false, error: "Texniki xəta. Bir azdan yenidən cəhd edin." };
  }
}

export async function submitReferralAction(input: {
  doctorName: string;
  clinic?: string;
  doctorPhone: string;
  patientName: string;
  examType: string;
  note?: string;
  centerId?: string;
}): Promise<FormResult> {
  const parsed = referralSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const data = parsed.data;

  try {
    const phone = normalizePhone(data.doctorPhone) ?? data.doctorPhone;
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.referral.count({
      where: { doctorPhone: phone, createdAt: { gte: hourAgo } },
    });
    if (recent >= 10) {
      return {
        ok: false,
        error: "Çox sayda göndəriş aşkarlandı. Bir saatdan sonra cəhd edin.",
      };
    }

    await prisma.referral.create({
      data: {
        doctorName: data.doctorName,
        clinic: data.clinic || null,
        doctorPhone: phone,
        patientName: data.patientName,
        examType: data.examType,
        note: data.note || null,
        centerId: data.centerId || null,
      },
    });

    const center = data.centerId
      ? await prisma.centerProfile
          .findUnique({ where: { id: data.centerId }, select: { name: true } })
          .catch(() => null)
      : null;
    await notifyNewReferral({
      doctorName: data.doctorName,
      clinic: data.clinic || null,
      doctorPhone: phone,
      patientName: data.patientName,
      examType: data.examType,
      centerName: center?.name,
      note: data.note || null,
    }).catch(() => {});

    return {
      ok: true,
      message: "Göndəriş qeydə alındı. Seçilən mərkəz pasiyentlə əlaqə saxlayacaq.",
    };
  } catch {
    return { ok: false, error: "Texniki xəta. Bir azdan yenidən cəhd edin." };
  }
}

export async function submitWaitlistAction(input: {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  audience?: "patient" | "doctor" | "center";
  locale: "az" | "ru";
  note?: string;
}): Promise<FormResult> {
  const parsed = waitlistSignupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat / Неверные данные" };
  }
  const data = parsed.data;

  try {
    // Light anti-spam: max 5 signups per hour per contact (phone or email)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.waitlistSignup.count({
      where: {
        createdAt: { gte: hourAgo },
        OR: [
          ...(data.phone ? [{ phone: data.phone }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });
    if (recent >= 5) {
      return {
        ok: false,
        error: "Çox sayda müraciət. Bir azdan yenidən cəhd edin. / Слишком много заявок. Попробуйте позже.",
      };
    }

    await prisma.waitlistSignup.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        city: data.city || null,
        audience: data.audience || null,
        locale: data.locale,
        note: data.note || null,
      },
    });

    return {
      ok: true,
      message:
        data.locale === "ru"
          ? "Спасибо! Вы в списке ожидания — мы свяжемся с вами."
          : "Təşəkkürlər! Siz siyahıdasınız — sizinlə əlaqə saxlayacağıq.",
    };
  } catch {
    return { ok: false, error: "Texniki xəta. Bir azdan yenidən cəhd edin. / Техническая ошибка." };
  }
}
