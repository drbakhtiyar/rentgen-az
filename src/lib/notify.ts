import "server-only";
import { sendNotificationEmail } from "./email";
import { sendSms } from "./sms";
import { toGsmAscii } from "./sms";
import { formatPhoneDisplay } from "./phone";
import { SITE_URL } from "./env";
import type { RequestStatus } from "@/generated/prisma/enums";

/** SMS the center when a doctor requests a collaboration/partnership. */
export async function smsCenterPartnerRequest(
  centerPhone: string,
  doctorName: string,
): Promise<void> {
  const name = toGsmAscii(doctorName).slice(0, 40);
  const msg = `Rentgen.az: ${name} sizinle emekdasliq sorgusu gonderdi. Panel: rentgen.az/merkez/hekimler`;
  await sendSms(centerPhone, msg, "other").catch(() => {});
}

/** SMS the patient when their rentgen result link is ready. */
export async function smsPatientResultReady(
  patientPhone: string,
  centerName: string,
): Promise<void> {
  const name = toGsmAscii(centerName).slice(0, 40);
  const msg = `Rentgen.az: ${name} merkezinde rentgen neticeniz hazirdir. Kabinet: rentgen.az/kabinet`;
  await sendSms(patientPhone, msg, "other").catch(() => {});
}

/** SMS the partner doctor when a referred patient's result is ready. */
export async function smsDoctorResultReady(
  doctorPhone: string,
  patientName: string,
): Promise<void> {
  const name = toGsmAscii(patientName).slice(0, 30);
  const msg = `Rentgen.az: pasiyentiniz ${name} rentgen cekdirdi, netice hazirdir. Panel: rentgen.az/hekim`;
  await sendSms(doctorPhone, msg, "other").catch(() => {});
}

/**
 * SMS the center when a patient books/requests an appointment.
 * Kept lean (1 SMS segment): first name + time only — no surname, no phone,
 * no service. Full details are in the center panel.
 */
export async function smsCenterNewRequest(
  centerPhone: string,
  opts: { patientName: string; preferredDate?: Date | null },
): Promise<void> {
  const first = (opts.patientName.trim().split(/\s+/)[0] || "Pasiyent").slice(0, 20);
  let msg: string;
  if (opts.preferredDate) {
    const when = new Intl.DateTimeFormat("az", {
      timeZone: "Asia/Baku",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(opts.preferredDate);
    msg = `Rentgen.az: ${first} - ${when} qebula yazildi. Panel: rentgen.az/merkez`;
  } else {
    msg = `Rentgen.az: ${first} yeni qebul sorgusu gonderdi. Panel: rentgen.az/merkez`;
  }
  await sendSms(centerPhone, msg, "center_request").catch(() => {});
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
  await sendSms(patientPhone, msg, "patient_status").catch(() => {});
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
