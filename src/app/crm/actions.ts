"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { normalizePhone } from "@/lib/phone";

export type CrmResult = { ok: true } | { ok: false; error: string };

// CRM is a Platinum-only feature. Returns the center only when it qualifies.
async function currentCenter() {
  const user = await requireRole("CENTER");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, plan: true },
  });
  if (!center || center.plan !== "PLATINUM") return null;
  return center;
}

/**
 * Center adds a patient/appointment by hand (walk-ins or customers who did not
 * come through our system). If the phone belongs to a registered patient we
 * link the card so full features (files) unlock; otherwise it's an external
 * card with no linked account.
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

  // Link to a registered patient by phone, if one exists.
  const patientUser = await prisma.user.findUnique({
    where: { phone },
    select: { patientProfile: { select: { id: true } } },
  });
  const patientId = patientUser?.patientProfile?.id ?? null;

  let preferredDate: Date | null = null;
  if (input.ymd && input.time && /^\d{4}-\d{2}-\d{2}$/.test(input.ymd) && /^\d{2}:\d{2}$/.test(input.time)) {
    const d = new Date(`${input.ymd}T${input.time}:00+04:00`);
    if (!Number.isNaN(d.getTime())) preferredDate = d;
  }

  await prisma.appointmentRequest.create({
    data: {
      centerId: center.id,
      patientId,
      name,
      phone,
      serviceSlug: input.serviceSlug || null,
      note: input.note?.trim() || null,
      preferredDate,
      // Confirmed walk-ins are marked CONTACTED (hard-held); otherwise NEW.
      status: input.confirmed ? "CONTACTED" : "NEW",
    },
  });

  revalidatePath("/crm");
  revalidatePath("/crm/teqvim");
  revalidatePath("/crm/pasiyentler");
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
