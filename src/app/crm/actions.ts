"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { normalizePhone } from "@/lib/phone";
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

/** Update the center's CRM slot settings. */
export async function updateSlotSettingsAction(input: {
  enabled: boolean;
  slotMinutes: number;
  slotCapacity: number;
}): Promise<CrmResult> {
  const center = await currentCenter();
  if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

  const slotMinutes = Math.min(240, Math.max(5, Math.round(input.slotMinutes || 30)));
  const slotCapacity = Math.min(50, Math.max(1, Math.round(input.slotCapacity || 1)));

  await prisma.centerProfile.update({
    where: { id: center.id },
    data: { slotBookingEnabled: !!input.enabled, slotMinutes, slotCapacity },
  });

  revalidatePath("/crm/ayarlar");
  revalidatePath("/crm/teqvim");
  return { ok: true };
}
