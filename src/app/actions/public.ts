"use server";

import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { getCurrentUser } from "@/lib/auth/rbac";
import { appointmentRequestSchema, referralSchema } from "@/lib/validation";

export type FormResult = { ok: boolean; error?: string; message?: string };

export async function submitAppointmentAction(input: {
  name: string;
  phone: string;
  centerId?: string;
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
        serviceSlug: data.serviceSlug || null,
        note: data.note || null,
        patientId,
      },
    });

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

    return {
      ok: true,
      message: "Göndəriş qeydə alındı. Seçilən mərkəz pasiyentlə əlaqə saxlayacaq.",
    };
  } catch {
    return { ok: false, error: "Texniki xəta. Bir azdan yenidən cəhd edin." };
  }
}
