"use server";

import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type CenterEventType =
  | "view"
  | "call"
  | "whatsapp"
  | "directions"
  | "license"
  | "faq"
  | "website"
  | "instagram";

/** Fire-and-forget analytics event for a center (public, best-effort). */
export async function trackCenterEventAction(
  centerId: string,
  type: CenterEventType,
): Promise<void> {
  // Zibil hadisə qorunması (2026-08-14): normal ziyarətçi bu həddə çatmır.
  const rl = await rateLimit("public:track", clientIp({ headers: await headers() }), 120, 3600);
  if (!rl.allowed) return;
  if (!centerId || !["view", "call", "whatsapp", "directions", "license", "faq", "website", "instagram"].includes(type)) return;
  try {
    await prisma.centerEvent.create({ data: { centerId, type } });
  } catch {
    /* best-effort */
  }
}

/** Fire-and-forget search event (aggregate-only, no user link). Records the
 *  top of the discovery funnel. Ignores "empty" (no-filter) catalogue loads. */
export async function trackSearchEventAction(input: {
  query?: string;
  city?: string;
  service?: string;
  results?: number;
}): Promise<void> {
  // Zibil hadisə qorunması (2026-08-14): normal ziyarətçi bu həddə çatmır.
  const rl = await rateLimit("public:search", clientIp({ headers: await headers() }), 120, 3600);
  if (!rl.allowed) return;
  const query = (input.query ?? "").trim().slice(0, 100) || null;
  const city = (input.city ?? "").trim().slice(0, 80) || null;
  const service = (input.service ?? "").trim().slice(0, 80) || null;
  if (!query && !city && !service) return; // only real searches
  const results =
    typeof input.results === "number" && Number.isFinite(input.results)
      ? Math.max(0, Math.min(9999, Math.trunc(input.results)))
      : null;
  try {
    await prisma.searchEvent.create({ data: { query, city, service, results } });
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
