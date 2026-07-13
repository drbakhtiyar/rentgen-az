import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Daily cron: downgrade paid plans whose term has ended back to FREE (and notify
 * the owner), plus warn owners whose plan expires within 3 days. Protected by
 * CRON_SECRET (Vercel Cron sends it as a Bearer token).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const soon = new Date(now.getTime() + 3 * DAY);
  let downgraded = 0;
  let warned = 0;

  // ---- 1) Downgrade expired plans → FREE ----
  const expiredCenters = await prisma.centerProfile.findMany({
    where: { plan: { not: "FREE" }, planUntil: { lt: now } },
    select: { id: true, userId: true },
  });
  for (const c of expiredCenters) {
    try {
      await prisma.centerProfile.update({ where: { id: c.id }, data: { plan: "FREE" } });
      await notifyUser(
        c.userId,
        "PLAN_EXPIRED",
        "Paketinizin müddəti bitdi",
        "Paketiniz FREE paketə keçdi. İmkanları bərpa etmək üçün paketi yeniləyin.",
        "/merkez/paket",
      );
      downgraded++;
    } catch {
      /* skip; retry next run */
    }
  }

  const expiredDoctors = await prisma.doctorProfile.findMany({
    where: { plan: { not: "FREE" }, planUntil: { lt: now } },
    select: { id: true, userId: true },
  });
  for (const d of expiredDoctors) {
    try {
      await prisma.doctorProfile.update({ where: { id: d.id }, data: { plan: "FREE" } });
      await notifyUser(
        d.userId,
        "PLAN_EXPIRED",
        "Paketinizin müddəti bitdi",
        "Paketiniz FREE paketə keçdi. İmkanları bərpa etmək üçün paketi yeniləyin.",
        "/hekim/paket",
      );
      downgraded++;
    } catch {
      /* skip */
    }
  }

  // ---- 2) Warn plans expiring within 3 days (deduped per unread notice) ----
  const expiringCenters = await prisma.centerProfile.findMany({
    where: { plan: { not: "FREE" }, planUntil: { gte: now, lte: soon } },
    select: { userId: true, planUntil: true },
  });
  for (const c of expiringCenters) {
    warned += await warnExpiring(c.userId, c.planUntil, now, "/merkez/paket");
  }
  const expiringDoctors = await prisma.doctorProfile.findMany({
    where: { plan: { not: "FREE" }, planUntil: { gte: now, lte: soon } },
    select: { userId: true, planUntil: true },
  });
  for (const d of expiringDoctors) {
    warned += await warnExpiring(d.userId, d.planUntil, now, "/hekim/paket");
  }

  return NextResponse.json({ ok: true, downgraded, warned });
}

/** Send an "expiring soon" notice, skipping if one is already unread. Returns 1 if sent. */
async function warnExpiring(
  userId: string,
  planUntil: Date | null,
  now: Date,
  link: string,
): Promise<number> {
  if (!planUntil) return 0;
  try {
    const already = await prisma.notification.findFirst({
      where: { userId, type: "PLAN_EXPIRING", read: false },
      select: { id: true },
    });
    if (already) return 0;
    const days = Math.max(1, Math.ceil((planUntil.getTime() - now.getTime()) / DAY));
    await notifyUser(
      userId,
      "PLAN_EXPIRING",
      "Paketinizin müddəti bitir",
      `Paketiniz ${days} gün sonra bitir. Kəsintisiz davam üçün paketi yeniləyin.`,
      link,
    );
    return 1;
  } catch {
    return 0;
  }
}
