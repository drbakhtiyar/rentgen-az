"use server";

import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { getCurrentUser } from "@/lib/auth/rbac";
import {
  appointmentRequestSchema,
  referralSchema,
  waitlistSignupSchema,
} from "@/lib/validation";
import { notifyNewAppointment, notifyNewReferral } from "@/lib/notify";

export type FormResult = { ok: boolean; error?: string; message?: string };

export async function submitAppointmentAction(input: {
  name: string;
  phone: string;
  centerId?: string;
  doctorId?: string;
  serviceSlug?: string;
  note?: string;
}): Promise<FormResult> {
  const parsed = appointmentRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış məlumat" };
  }
  const data = parsed.data;

  try {
    const user = await getCurrentUser();
    const patientId =
      user?.role === "PATIENT" ? user.patientProfile?.id ?? null : null;

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

    await prisma.appointmentRequest.create({
      data: {
        name: data.name,
        phone,
        centerId: data.centerId || null,
        doctorId: data.doctorId || null,
        serviceSlug: data.serviceSlug || null,
        note: data.note || null,
        patientId,
      },
    });

    // Notify (best-effort — never block the patient's submission)
    const center = data.centerId
      ? await prisma.centerProfile
          .findUnique({ where: { id: data.centerId }, select: { name: true, slug: true } })
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
