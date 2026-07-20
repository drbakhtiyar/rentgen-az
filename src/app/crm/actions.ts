"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getActingCenter } from "@/lib/auth/acting";
import { normalizePhone } from "@/lib/phone";
import { sendCenterSms, creditCenterSms, SMS_PACKAGES, ADMIN_SMS_RESERVE } from "@/lib/center-sms";
import { alertAdminSms, getSmsBalance, sendOtpSms } from "@/lib/sms";
import { createOtp, verifyOtp } from "@/lib/otp";
import { env } from "@/lib/env";
import { debitWallet } from "@/lib/wallet";
import { isSlotAvailable, getCenterPatients } from "@/lib/crm";

export type CrmResult = { ok: true } | { ok: false; error: string };

type SlotCenter = { id: string; hours: unknown; slotMinutes: number; slotCapacity: number };

const OWNER_ONLY = "Bu əməliyyatı yalnız mərkəz sahibi edə bilər.";

// CRM is a Platinum-only feature. The acting party is the owner or an active
// assistant; `requireOwner` gates settings/money operations to the owner.
async function currentCenter(requireOwner = false): Promise<(SlotCenter & { isOwner: boolean }) | null> {
  const acting = await getActingCenter();
  if (!acting || acting.center.plan !== "PLATINUM") return null;
  if (requireOwner && !acting.isOwner) return null;
  const c = acting.center;
  return { id: c.id, hours: c.hours, slotMinutes: c.slotMinutes, slotCapacity: c.slotCapacity, isOwner: acting.isOwner };
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
  const center = await currentCenter(true);
  if (!center) return { ok: false, error: OWNER_ONLY };
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
  const center = await currentCenter(true);
  if (!center) return { ok: false, error: OWNER_ONLY };
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

export type CampaignAudience = "all" | "lapsed" | "insystem";
const CAMPAIGN_LAPSED_DAYS = 90;
const CAMPAIGN_MAX_RECIPIENTS = 500; // per blast — keeps the action within limits
const CAMPAIGN_BATCH = 20; // concurrent sends per round

export type CampaignResult =
  | { ok: true; sent: number; failed: number; skipped: number; noBalance: boolean }
  | { ok: false; error: string };

/** Resolve a campaign audience to a deduped phone list. */
function campaignRecipients(
  patients: Awaited<ReturnType<typeof getCenterPatients>>,
  audience: CampaignAudience,
): { phone: string; name: string }[] {
  const now = Date.now();
  return patients
    .filter((p) => {
      if (audience === "insystem") return !!p.patientId;
      if (audience === "lapsed") {
        return (
          !!p.lastVisit &&
          !p.nextVisit &&
          now - p.lastVisit.getTime() > CAMPAIGN_LAPSED_DAYS * 86400000
        );
      }
      return true;
    })
    .map((p) => ({ phone: p.phone, name: p.name }));
}

/**
 * SMS campaign (blast) to the center's patient base — paid from the SMS
 * balance (1 credit per recipient). Stops as soon as the balance runs out.
 */
export async function sendCampaignAction(input: {
  audience: CampaignAudience;
  message: string;
}): Promise<CampaignResult> {
  const center = await currentCenter(true);
  if (!center) return { ok: false, error: OWNER_ONLY };

  const message = input.message?.trim();
  if (!message) return { ok: false, error: "Mesaj mətni boşdur." };
  if (message.length > 400) return { ok: false, error: "Mesaj çox uzundur (maks. 400 simvol)." };

  const patients = await getCenterPatients(center.id);
  let recipients = campaignRecipients(patients, input.audience);
  if (recipients.length === 0) return { ok: false, error: "Bu auditoriyada pasiyent yoxdur." };
  const skipped = Math.max(0, recipients.length - CAMPAIGN_MAX_RECIPIENTS);
  recipients = recipients.slice(0, CAMPAIGN_MAX_RECIPIENTS);

  let sent = 0;
  let failed = 0;
  let noBalance = false;
  for (let i = 0; i < recipients.length && !noBalance; i += CAMPAIGN_BATCH) {
    const batch = recipients.slice(i, i + CAMPAIGN_BATCH);
    const results = await Promise.all(
      batch.map((r) => sendCenterSms(center.id, r.phone, message, "campaign")),
    );
    for (const res of results) {
      if (res.ok) sent++;
      else if ("noBalance" in res) noBalance = true;
      else failed++;
    }
  }

  revalidatePath("/crm/sms");
  return { ok: true, sent, failed, skipped, noBalance };
}

/**
 * Buy an SMS package instantly: pays from the wallet balance (top-ups go
 * through Payriff) and credits the SMS balance right away — no admin approval.
 * The platform's provider (Lsim) pool backs these units: purchases are capped
 * so at least ADMIN_SMS_RESERVE units always stay for the platform itself.
 */
export async function buySmsPackageAction(qty: number): Promise<CrmResult> {
  const user = await requireRole("CENTER");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, plan: true, name: true },
  });
  if (!center || center.plan !== "PLATINUM") return { ok: false, error: "Mərkəz tapılmadı." };
  const pack = SMS_PACKAGES.find((p) => p.qty === qty);
  if (!pack) return { ok: false, error: "Paket tapılmadı." };

  // Stock cap: keep the admin reserve in the provider pool.
  const pool = await getSmsBalance();
  if (pool != null) {
    const maxBuyable = Math.max(0, pool - ADMIN_SMS_RESERVE);
    if (pack.qty > maxBuyable) {
      await alertAdminSms(
        `rentgen.az: ${center.name} ${pack.qty} SMS almaq istədi, stok çatmadı (Lsim: ${pool}). SMS almaq lazımdır.`,
      ).catch(() => {});
      return {
        ok: false,
        error:
          maxBuyable > 0
            ? `Hazırda stokda maksimum ${maxBuyable} SMS var. Daha kiçik paket seçin — stok tezliklə artırılacaq.`
            : "SMS stoku müvəqqəti tükənib — tezliklə artırılacaq. Bir azdan yenidən cəhd edin.",
      };
    }
  }

  const res = await debitWallet(user.id, pack.price * 100, "SMS", `${pack.qty} SMS paketi (${pack.price} AZN)`);
  if (!res.ok) {
    return { ok: false, error: "Balans kifayət etmir. Paket / Balans səhifəsindən balansı artırın." };
  }
  await creditCenterSms(center.id, pack.qty, "PURCHASE", `${pack.qty} SMS paketi (${pack.price} AZN)`);

  revalidatePath("/crm/sms");
  revalidatePath("/merkez/paket");
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
  const center = await currentCenter(true);
  if (!center) return { ok: false, error: OWNER_ONLY };

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


// ------------------------- Assistants (owner-only) -------------------------

export type AssistantResult = { ok: boolean; error?: string; devCode?: string };

/**
 * Whether `phone` may be (re)assigned as THIS center's assistant. Mirrors the
 * doctor-side guard: a center/doctor/admin account, or a doctor's assistant, or
 * another center's assistant can't be one. Re-verifying this center's own
 * assistant phone is allowed. Returns an error message, or null if eligible.
 * Enforced in BOTH steps so a direct confirm() call can't bypass it.
 */
async function centerAssistantEligibility(phone: string, centerId: string): Promise<string | null> {
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
    return "Bu nömrə mərkəz/həkim/admin hesabına bağlıdır — asistent ola bilməz.";
  }
  if (existing?.doctorAssistantOf) {
    return "Bu nömrə artıq bir həkimin asistentidir.";
  }
  if (existing?.assistantOf && existing.assistantOf.centerId !== centerId) {
    return "Bu nömrə artıq başqa mərkəzin asistentidir.";
  }
  return null;
}

/**
 * Step 1 of adding an assistant: validate the phone and send an OTP to it.
 * The assistant is typically next to the owner and reads the code out loud —
 * confirming they really own that number.
 */
export async function startAddAssistantAction(input: {
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<AssistantResult> {
  const center = await currentCenter(true);
  if (!center) return { ok: false, error: OWNER_ONLY };
  if (input.firstName.trim().length < 2 || input.lastName.trim().length < 2) {
    return { ok: false, error: "Asistentin adı və soyadı tələb olunur." };
  }
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };

  const eligErr = await centerAssistantEligibility(phone, center.id);
  if (eligErr) return { ok: false, error: eligErr };
  // One assistant per center (re-verifying the same phone is allowed).
  const others = await prisma.centerAssistant.count({
    where: { centerId: center.id, user: { phone: { not: phone } } },
  });
  if (others > 0) {
    return { ok: false, error: "Hər mərkəzə maksimum 1 asistent əlavə etmək olar." };
  }

  const r = await createOtp(phone);
  if (!r.ok) return { ok: false, error: r.error };
  const sms = await sendOtpSms(phone, r.code);
  if (!sms.ok) return { ok: false, error: "SMS göndərilə bilmədi. Yenidən cəhd edin." };
  return { ok: true, devCode: env.smsProvider === "dev" ? r.code : undefined };
}

/** Step 2: verify the OTP and create/activate the assistant. */
export async function confirmAddAssistantAction(input: {
  firstName: string;
  lastName: string;
  phone: string;
  code: string;
}): Promise<AssistantResult> {
  const center = await currentCenter(true);
  if (!center) return { ok: false, error: OWNER_ONLY };
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };
  const eligErr = await centerAssistantEligibility(phone, center.id);
  if (eligErr) return { ok: false, error: eligErr };
  const v = await verifyOtp(phone, input.code.trim());
  if (!v.ok) return { ok: false, error: v.error };
  const others = await prisma.centerAssistant.count({
    where: { centerId: center.id, user: { phone: { not: phone } } },
  });
  if (others > 0) {
    return { ok: false, error: "Hər mərkəzə maksimum 1 asistent əlavə etmək olar." };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const user =
    (await prisma.user.findUnique({ where: { phone }, select: { id: true } })) ??
    (await prisma.user.create({ data: { phone, role: "ASSISTANT" }, select: { id: true } }));

  await prisma.centerAssistant.upsert({
    where: { userId: user.id },
    create: { userId: user.id, centerId: center.id, firstName, lastName },
    update: { firstName, lastName, active: true },
  });

  revalidatePath("/crm/ayarlar");
  return { ok: true };
}

/** Activate / deactivate an assistant (deactivated ones can't log in). */
export async function setAssistantActiveAction(id: string, active: boolean): Promise<CrmResult> {
  const center = await currentCenter(true);
  if (!center) return { ok: false, error: OWNER_ONLY };
  const link = await prisma.centerAssistant.findUnique({ where: { id }, select: { centerId: true } });
  if (!link || link.centerId !== center.id) return { ok: false, error: "Asistent tapılmadı." };
  await prisma.centerAssistant.update({ where: { id }, data: { active } });
  revalidatePath("/crm/ayarlar");
  return { ok: true };
}

/** Remove an assistant entirely (their login stops working immediately). */
export async function removeAssistantAction(id: string): Promise<CrmResult> {
  const center = await currentCenter(true);
  if (!center) return { ok: false, error: OWNER_ONLY };
  const link = await prisma.centerAssistant.findUnique({ where: { id }, select: { centerId: true } });
  if (!link || link.centerId !== center.id) return { ok: false, error: "Asistent tapılmadı." };
  await prisma.centerAssistant.delete({ where: { id } });
  revalidatePath("/crm/ayarlar");
  return { ok: true };
}
