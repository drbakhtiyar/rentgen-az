"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { normalizePhone } from "@/lib/phone";
import { sendCenterSms, SMS_PACKAGES } from "@/lib/center-sms";
import { alertAdminSms } from "@/lib/sms";
import { isSlotAvailable } from "@/lib/crm";

export type CrmResult = { ok: true } | { ok: false; error: string };

type SlotCenter = { id: string; hours: unknown; slotMinutes: number; slotCapacity: number };

// CRM is a Platinum-only feature. Returns the center (with slot config) only
// when it qualifies.
async function currentCenter(): Promise<SlotCenter | null> {
  const user = await requireRole("CENTER");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, plan: true, hours: true, slotMinutes: true, slotCapacity: true },
  });
  if (!center || center.plan !== "PLATINUM") return null;
  return { id: center.id, hours: center.hours, slotMinutes: center.slotMinutes, slotCapacity: center.slotCapacity };
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^\d{2}:\d{2}$/;

function toMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function parseWhen(ymd?: string | null, time?: string | null): { date: Date; startMin: number } | null {
  if (!ymd || !time || !YMD.test(ymd) || !HM.test(time)) return null;
  const date = new Date(`${ymd}T${time}:00+04:00`);
  if (Number.isNaN(date.getTime())) return null;
  return { date, startMin: toMin(time) };
}

async function durationFor(centerId: string, serviceSlug: string | null | undefined, fallback: number): Promise<number> {
  if (!serviceSlug) return fallback;
  const cs = await prisma.centerService.findFirst({
    where: { centerId, service: { slug: serviceSlug } },
    select: { durationMin: true },
  });
  return cs?.durationMin || fallback;
}

const CONFLICT = "Bu vaxt artıq doludur. Başqa vaxt seçin.";

/**
 * Center adds a patient/appointment by hand (walk-ins or external customers).
 * If a time is given, it must be free (capacity + no time block) — double
 * booking is rejected. Registered patients (by phone) get linked so files work.
 */
export async function addManualAppointmentAction(input: {
  name: string;
  phone: string;
  serviceSlug?: string | null;
  ymd?: string | null;
  time?: string | null;
  note?: string | null;
  confirmed?: boolean;
}): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Ad tələb olunur." };
  const phone = normalizePhone(input.phone ?? "");
  if (!phone) return { ok: false, error: "Düzgün telefon nömrəsi daxil edin." };

  const when = parseWhen(input.ymd, input.time);
  if (when) {
    const dur = await durationFor(center.id, input.serviceSlug, center.slotMinutes);
    const free = await isSlotAvailable(center, center.id, input.ymd!, when.startMin, dur);
    if (!free) return { ok: false, error: CONFLICT };
  }

  const patientUser = await prisma.user.findUnique({
    where: { phone },
    select: { patientProfile: { select: { id: true } } },
  });
  const patientId = patientUser?.patientProfile?.id ?? null;

  await prisma.appointmentRequest.create({
    data: {
      centerId: center.id,
      patientId,
      name,
      phone,
      serviceSlug: input.serviceSlug || null,
      note: input.note?.trim() || null,
      preferredDate: when?.date ?? null,
      status: input.confirmed ? "CONTACTED" : "NEW",
    },
  });

  revalidatePath("/crm");
  revalidatePath("/crm/teqvim");
  revalidatePath("/crm/pasiyentler");
  return { ok: true };
}

/** Edit an appointment (details + reschedule). Rejects double booking. */
export async function updateAppointmentAction(input: {
  id: string;
  name?: string;
  phone?: string;
  serviceSlug?: string | null;
  ymd?: string | null;
  time?: string | null;
  note?: string | null;
}): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const req = await prisma.appointmentRequest.findUnique({
    where: { id: input.id },
    select: { centerId: true },
  });
  if (!req || req.centerId !== center.id) return { ok: false, error: "Randevu tapılmadı." };

  const name = input.name?.trim();
  if (input.name != null && !name) return { ok: false, error: "Ad tələb olunur." };
  let phone: string | undefined;
  if (input.phone != null) {
    const p = normalizePhone(input.phone);
    if (!p) return { ok: false, error: "Düzgün telefon nömrəsi daxil edin." };
    phone = p;
  }

  const when = parseWhen(input.ymd, input.time);
  if (when) {
    const dur = await durationFor(center.id, input.serviceSlug, center.slotMinutes);
    const free = await isSlotAvailable(center, center.id, input.ymd!, when.startMin, dur, input.id);
    if (!free) return { ok: false, error: CONFLICT };
  }

  const patientId = phone
    ? (await prisma.user.findUnique({ where: { phone }, select: { patientProfile: { select: { id: true } } } }))
        ?.patientProfile?.id ?? undefined
    : undefined;

  await prisma.appointmentRequest.update({
    where: { id: input.id },
    data: {
      ...(name != null ? { name } : {}),
      ...(phone != null ? { phone } : {}),
      ...(patientId !== undefined ? { patientId } : {}),
      ...(input.serviceSlug !== undefined ? { serviceSlug: input.serviceSlug || null } : {}),
      ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
      ...(when ? { preferredDate: when.date } : {}),
    },
  });

  revalidatePath("/crm");
  revalidatePath("/crm/teqvim");
  revalidatePath("/crm/pasiyentler");
  return { ok: true };
}

/**
 * Drag-reschedule: move an appointment to a new date/time. `agreed` reflects the
 * "is the new time agreed with the patient?" prompt — yes → status CONTACTED
 * (confirmed), no → NEW (unconfirmed). Terminal statuses (COMPLETED/CANCELLED)
 * keep their status. Rejects a slot that is full or on a block.
 */
export async function rescheduleAppointmentAction(input: {
  id: string;
  ymd: string;
  time: string;
  agreed: boolean;
}): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const req = await prisma.appointmentRequest.findUnique({
    where: { id: input.id },
    select: { centerId: true, status: true, serviceSlug: true },
  });
  if (!req || req.centerId !== center.id) return { ok: false, error: "Randevu tapılmadı." };

  const when = parseWhen(input.ymd, input.time);
  if (!when) return { ok: false, error: "Vaxt düzgün deyil." };
  const dur = await durationFor(center.id, req.serviceSlug, center.slotMinutes);
  const free = await isSlotAvailable(center, center.id, input.ymd, when.startMin, dur, input.id);
  if (!free) return { ok: false, error: CONFLICT };

  const terminal = req.status === "COMPLETED" || req.status === "CANCELLED";
  const status = terminal ? req.status : input.agreed ? "CONTACTED" : "NEW";

  await prisma.appointmentRequest.update({
    where: { id: input.id },
    data: { preferredDate: when.date, status },
  });

  revalidatePath("/crm");
  revalidatePath("/crm/teqvim");
  revalidatePath("/crm/pasiyentler");
  return { ok: true };
}

/** Delete an appointment. Blocked if it has rentgen files (would orphan B2). */
export async function deleteAppointmentAction(id: string): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const req = await prisma.appointmentRequest.findUnique({
    where: { id },
    select: { centerId: true, _count: { select: { files: true } } },
  });
  if (!req || req.centerId !== center.id) return { ok: false, error: "Randevu tapılmadı." };
  if (req._count.files > 0) {
    return { ok: false, error: "Bu randevuda fayllar var. Əvvəlcə faylları silin." };
  }

  await prisma.appointmentRequest.delete({ where: { id } });
  revalidatePath("/crm");
  revalidatePath("/crm/teqvim");
  revalidatePath("/crm/pasiyentler");
  return { ok: true };
}

/** Block a time range (break, lunch, holiday) — no patient can book it. */
export async function addTimeBlockAction(input: {
  ymd: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
}): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  if (!YMD.test(input.ymd) || !HM.test(input.startTime) || !HM.test(input.endTime)) {
    return { ok: false, error: "Tarix və vaxtı düzgün daxil edin." };
  }
  if (toMin(input.endTime) <= toMin(input.startTime)) {
    return { ok: false, error: "Bitmə vaxtı başlanğıcdan sonra olmalıdır." };
  }
  await prisma.centerTimeBlock.create({
    data: {
      centerId: center.id,
      startAt: new Date(`${input.ymd}T${input.startTime}:00+04:00`),
      endAt: new Date(`${input.ymd}T${input.endTime}:00+04:00`),
      reason: input.reason?.trim() || null,
    },
  });
  revalidatePath("/crm/teqvim");
  return { ok: true };
}

/** Remove a time block. */
export async function deleteTimeBlockAction(id: string): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  const block = await prisma.centerTimeBlock.findUnique({ where: { id }, select: { centerId: true } });
  if (!block || block.centerId !== center.id) return { ok: false, error: "Blok tapılmadı." };
  await prisma.centerTimeBlock.delete({ where: { id } });
  revalidatePath("/crm/teqvim");
  return { ok: true };
}

const DAY_SET = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

/** Declare a non-working day (holiday / day off). The whole day gets blocked. */
export async function addHolidayAction(input: { date: string; reason?: string | null }): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  if (!YMD.test(input.date)) return { ok: false, error: "Tarixi düzgün seçin." };
  try {
    await prisma.centerHoliday.create({
      data: { centerId: center.id, date: input.date, reason: input.reason?.trim() || null },
    });
  } catch {
    return { ok: false, error: "Bu tarix artıq qeyri-iş günü kimi əlavə edilib." };
  }
  revalidatePath("/crm/ayarlar");
  revalidatePath("/crm/teqvim");
  return { ok: true };
}

/** Remove a non-working day. */
export async function deleteHolidayAction(id: string): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  const h = await prisma.centerHoliday.findUnique({ where: { id }, select: { centerId: true } });
  if (!h || h.centerId !== center.id) return { ok: false, error: "Tapılmadı." };
  await prisma.centerHoliday.delete({ where: { id } });
  revalidatePath("/crm/ayarlar");
  revalidatePath("/crm/teqvim");
  return { ok: true };
}

/** Re-call: the center sends a "come back" SMS to a (usually lapsed) patient. */
export async function sendRecallSmsAction(input: { phone: string; name?: string }): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  const phone = normalizePhone(input.phone ?? "");
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };

  const profile = await prisma.centerProfile.findUnique({
    where: { id: center.id },
    select: { name: true },
  });
  const greeting = input.name?.trim() ? `Salam, ${input.name.trim()}! ` : "Salam! ";
  const msg = `${greeting}${profile?.name ?? "Mərkəz"} sizi yenidən müayinəyə dəvət edir. Randevu üçün bizimlə əlaqə saxlayın.`;
  const res = await sendCenterSms(center.id, phone, msg, "reminder");
  if (!res.ok) {
    return { ok: false, error: "noBalance" in res ? res.error : "SMS göndərilə bilmədi. Yenidən cəhd edin." };
  }
  return { ok: true };
}

/**
 * Invite a manually-added (not-in-system) patient to register. Sends an SMS
 * with a login link; when they sign in with this phone, their past guest
 * appointments are adopted into the account (see adoptGuestAppointments).
 */
export async function invitePatientAction(input: { phone: string; name?: string }): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  const phone = normalizePhone(input.phone ?? "");
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };

  // If already registered as a patient, no need to invite.
  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { patientProfile: { select: { id: true } } },
  });
  if (existing?.patientProfile) return { ok: false, error: "Bu pasiyent artıq sistemdədir." };

  const profile = await prisma.centerProfile.findUnique({
    where: { id: center.id },
    select: { name: true },
  });
  const greeting = input.name?.trim() ? `Salam, ${input.name.trim()}! ` : "Salam! ";
  const msg =
    `${greeting}${profile?.name ?? "Mərkəz"} sizi rentgen.az-da qeydiyyatdan keçməyə dəvət edir. ` +
    `Rentgen nəticələrinizə onlayn çıxış üçün nömrənizlə daxil olun: https://rentgen.az/giris?role=PATIENT`;
  const res = await sendCenterSms(center.id, phone, msg, "other");
  if (!res.ok) {
    return { ok: false, error: "noBalance" in res ? res.error : "SMS göndərilə bilmədi. Yenidən cəhd edin." };
  }
  return { ok: true };
}

/** Order an SMS package: creates a PENDING order and alerts the admin. */
export async function createSmsOrderAction(qty: number): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };
  const pack = SMS_PACKAGES.find((p) => p.qty === qty);
  if (!pack) return { ok: false, error: "Paket tapılmadı." };

  // One open order at a time — keeps the manual payment flow unambiguous.
  const open = await prisma.centerSmsOrder.findFirst({
    where: { centerId: center.id, status: "PENDING" },
    select: { id: true },
  });
  if (open) return { ok: false, error: "Gözləyən sifarişiniz var. Admin təsdiqindən sonra yenisini verə bilərsiniz." };

  const profile = await prisma.centerProfile.findUnique({
    where: { id: center.id },
    select: { name: true },
  });
  await prisma.centerSmsOrder.create({
    data: { centerId: center.id, qty: pack.qty, price: pack.price },
  });
  await alertAdminSms(
    `rentgen.az: ${profile?.name ?? "Mərkəz"} ${pack.qty} SMS paketi sifariş etdi (${pack.price} AZN). Admin paneldə təsdiqləyin.`,
  );

  revalidatePath("/crm/sms");
  return { ok: true };
}

/** Update the center's CRM slot settings (incl. the recurring lunch break). */
export async function updateSlotSettingsAction(input: {
  enabled: boolean;
  slotMinutes: number;
  slotCapacity: number;
  lunchEnabled?: boolean;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  lunchDays?: string[];
  remindersEnabled?: boolean;
  reminderHours?: number;
}): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const slotMinutes = Math.min(240, Math.max(5, Math.round(input.slotMinutes || 30)));
  const slotCapacity = Math.min(50, Math.max(1, Math.round(input.slotCapacity || 1)));
  const reminderHours = Math.min(168, Math.max(1, Math.round(input.reminderHours || 24)));

  // Lunch: only saved when enabled with a valid range + at least one day.
  let lunchStart: string | null = null;
  let lunchEnd: string | null = null;
  let lunchDays: string[] = [];
  if (input.lunchEnabled) {
    const s = input.lunchStart ?? "";
    const e = input.lunchEnd ?? "";
    if (!HM.test(s) || !HM.test(e)) return { ok: false, error: "Nahar vaxtını düzgün daxil edin." };
    if (toMin(e) <= toMin(s)) return { ok: false, error: "Nahar bitmə vaxtı başlanğıcdan sonra olmalıdır." };
    const days = (input.lunchDays ?? []).filter((d) => DAY_SET.has(d));
    if (days.length === 0) return { ok: false, error: "Ən azı bir gün seçin." };
    lunchStart = s;
    lunchEnd = e;
    lunchDays = days;
  }

  await prisma.centerProfile.update({
    where: { id: center.id },
    data: {
      slotBookingEnabled: !!input.enabled,
      slotMinutes,
      slotCapacity,
      lunchStart,
      lunchEnd,
      lunchDays,
      remindersEnabled: !!input.remindersEnabled,
      reminderHours,
    },
  });

  revalidatePath("/crm/ayarlar");
  revalidatePath("/crm/teqvim");
  return { ok: true };
}
