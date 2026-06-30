import "server-only";
import { sendNotificationEmail } from "./email";
import { formatPhoneDisplay } from "./phone";
import { SITE_URL } from "./env";

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
