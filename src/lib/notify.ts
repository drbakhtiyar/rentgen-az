import "server-only";
import { sendNotificationEmail } from "./email";
import { sendSms } from "./sms";
import { formatPhoneDisplay } from "./phone";
import { SITE_URL } from "./env";
import type { RequestStatus } from "@/generated/prisma/enums";

/** SMS the center's own phone when a patient sends them a request. */
export async function smsCenterNewRequest(
  centerPhone: string,
  opts: { patientName: string; serviceName?: string | null },
): Promise<void> {
  const svc = opts.serviceName ? ` (${opts.serviceName})` : "";
  const msg = `Rentgen.az: Yeni müraciət — ${opts.patientName}${svc}. Panelinizdə baxın: ${SITE_URL}/merkez`;
  await sendSms(centerPhone, msg).catch(() => {});
}

const STATUS_LABEL_AZ: Record<RequestStatus, string> = {
  NEW: "yeni",
  CONTACTED: "əlaqə saxlanıldı",
  COMPLETED: "tamamlandı",
  CANCELLED: "ləğv edildi",
};

/** SMS the patient when the status of their request changes. */
export async function smsPatientStatusChange(
  patientPhone: string,
  opts: { status: RequestStatus; centerName?: string | null },
): Promise<void> {
  const where = opts.centerName ? ` — ${opts.centerName}` : "";
  const msg = `Rentgen.az: müraciətinizin statusu yeniləndi: «${STATUS_LABEL_AZ[opts.status]}»${where}.`;
  await sendSms(patientPhone, msg).catch(() => {});
}

/** Fired when a patient submits an appointment request. */
export async function notifyNewAppointment(data: {
  name: string;
  phone: string;
  centerName?: string | null;
  centerSlug?: string | null;
  serviceSlug?: string | null;
  note?: string | null;
}) {
  const subject = `[rentgen.az] Yeni müraciət — ${data.name}`;
  return sendNotificationEmail({
    subject,
    fields: {
      "Bildiriş növü": "Müayinə müraciəti",
      "Ad, Soyad": data.name,
      Telefon: formatPhoneDisplay(data.phone),
      Mərkəz: data.centerName || "Ümumi müraciət (mərkəz seçilməyib)",
      Xidmət: data.serviceSlug || "—",
      Qeyd: data.note || "—",
      Profil: data.centerSlug ? `${SITE_URL}/rentgen-merkezleri/${data.centerSlug}` : "—",
    },
  });
}

/** Fired when a doctor submits a referral. */
export async function notifyNewReferral(data: {
  doctorName: string;
  clinic?: string | null;
  doctorPhone: string;
  patientName: string;
  examType: string;
  centerName?: string | null;
  note?: string | null;
}) {
  const subject = `[rentgen.az] Yeni həkim göndərişi — ${data.patientName}`;
  return sendNotificationEmail({
    subject,
    fields: {
      "Bildiriş növü": "Həkim göndərişi",
      Həkim: data.doctorName,
      Klinika: data.clinic || "—",
      "Həkim telefonu": formatPhoneDisplay(data.doctorPhone),
      Pasiyent: data.patientName,
      "Lazım olan müayinə": data.examType,
      "Seçilmiş mərkəz": data.centerName || "Seçilməyib",
      Qeyd: data.note || "—",
    },
  });
}
