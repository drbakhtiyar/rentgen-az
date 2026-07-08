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
  const msg = `${name} sizinle emekdasliq sorgusu gonderdi. Panel: rentgen.az/merkez/hekimler`;
  await sendSms(centerPhone, msg, "other").catch(() => {});
}

/** SMS the patient when their rentgen result link is ready. */
export async function smsPatientResultReady(
  patientPhone: string,
  centerName: string,
): Promise<void> {
  const name = toGsmAscii(centerName).slice(0, 40);
  const msg = `${name} merkezinde rentgen neticeniz hazirdir. Kabinet: rentgen.az/kabinet`;
  await sendSms(patientPhone, msg, "other").catch(() => {});
}

/** SMS the partner doctor when a referred patient's result is ready. */
export async function smsDoctorResultReady(
  doctorPhone: string,
  patientName: string,
): Promise<void> {
  const name = toGsmAscii(patientName).slice(0, 30);
  const msg = `pasiyentiniz ${name} rentgen cekdirdi, netice hazirdir. Panel: rentgen.az/hekim`;
  await sendSms(doctorPhone, msg, "other").catch(() => {});
}

/** DD.MM.YYYY, HH:MM in Baku time. */
function fmtBookingDateTime(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baku",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}, ${get("hour")}:${get("minute")}`;
}

function bookingBody(firstLine: string, lines: (string | null | undefined)[]): string {
  return [firstLine, ...lines]
    .filter((l): l is string => Boolean(l && String(l).trim()))
    .map((l) => toGsmAscii(l))
    .join("\n");
}

/** SMS the patient after their booking is registered (with the center's phone). */
export async function smsPatientBooking(
  patientPhone: string,
  opts: {
    patientName: string;
    doctorName?: string | null;
    dateTime?: Date | null;
    serviceName?: string | null;
    centerPhone?: string | null;
  },
): Promise<void> {
  const msg = bookingBody("Sizin randevunuz qeyde alindi", [
    opts.patientName,
    opts.doctorName,
    opts.dateTime ? fmtBookingDateTime(opts.dateTime) : null,
    opts.serviceName,
    opts.centerPhone ? formatPhoneDisplay(opts.centerPhone) : null,
  ]);
  await sendSms(patientPhone, msg, "other").catch(() => {});
}

/** SMS the center about a new booking (with the patient's phone). */
export async function smsCenterBooking(
  centerPhone: string,
  opts: {
    patientName: string;
    patientPhone: string;
    doctorName?: string | null;
    dateTime?: Date | null;
    serviceName?: string | null;
  },
): Promise<void> {
  const msg = bookingBody("Yeni qeyd var", [
    opts.patientName,
    formatPhoneDisplay(opts.patientPhone),
    opts.doctorName,
    opts.dateTime ? fmtBookingDateTime(opts.dateTime) : null,
    opts.serviceName,
  ]);
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
  const msg = `müraciətinizin statusu yeniləndi: «${STATUS_LABEL_AZ[opts.status]}»${where}.`;
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
