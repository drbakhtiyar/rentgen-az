"use server";

import { prisma } from "@/lib/db";

export type CenterEventType = "view" | "call" | "whatsapp";

/** Fire-and-forget analytics event for a center (public, best-effort). */
export async function trackCenterEventAction(
  centerId: string,
  type: CenterEventType,
): Promise<void> {
  if (!centerId || !["view", "call", "whatsapp"].includes(type)) return;
  try {
    await prisma.centerEvent.create({ data: { centerId, type } });
  } catch {
    /* best-effort */
  }
}

/** Fire-and-forget doctor profile view event (public, best-effort). */
export async function trackDoctorEventAction(doctorId: string): Promise<void> {
  if (!doctorId) return;
  try {
    await prisma.doctorEvent.create({ data: { doctorId, type: "view" } });
  } catch {
    /* best-effort */
  }
}
