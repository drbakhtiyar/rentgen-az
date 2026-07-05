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
