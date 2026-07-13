import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications";
import { deleteObject } from "@/lib/b2";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;
const WARN_DAYS = 5; // notify before the plan expires
const GRACE_DAYS = 90; // files kept this long after downgrade, then deleted
const DATA_WARN_DAYS = 7; // notify before the files are deleted

/**
 * Daily cron for the plan lifecycle:
 *  1. Warn owners whose plan expires within 5 days (deduped).
 *  2. Downgrade expired plans → FREE (files kept; upper-tier perks frozen). A
 *     center's downgrade stamps planExpiredAt and warns about the 3-month
 *     deletion deadline.
 *  3. Remind centers ~7 days before their stored files are deleted (deduped).
 *  4. After 3 months without renewal, permanently delete the center's files.
 * Protected by CRON_SECRET (Vercel Cron sends it as a Bearer token).
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
  const soon = new Date(now.getTime() + WARN_DAYS * DAY);
  const deleteBefore = new Date(now.getTime() - GRACE_DAYS * DAY); // planExpiredAt older than this → delete
  let downgraded = 0;
  let warned = 0;
  let filesPurged = 0;

  // ---- 1) Warn plans expiring within 5 days ----
  const expiringCenters = await prisma.centerProfile.findMany({
    where: { plan: { not: "FREE" }, planUntil: { gte: now, lte: soon } },
    select: { userId: true, planUntil: true },
  });
  for (const c of expiringCenters) warned += await warnExpiring(c.userId, c.planUntil, now, "/merkez/paket");
  const expiringDoctors = await prisma.doctorProfile.findMany({
    where: { plan: { not: "FREE" }, planUntil: { gte: now, lte: soon } },
    select: { userId: true, planUntil: true },
  });
  for (const d of expiringDoctors) warned += await warnExpiring(d.userId, d.planUntil, now, "/hekim/paket");

  // ---- 2) Downgrade expired plans → FREE ----
  const expiredCenters = await prisma.centerProfile.findMany({
    where: { plan: { not: "FREE" }, planUntil: { lt: now } },
    select: { id: true, userId: true, planUntil: true },
  });
  for (const c of expiredCenters) {
    try {
      await prisma.centerProfile.update({
        where: { id: c.id },
        // Keep files; freeze perks; start the 3-month deletion clock.
        data: { plan: "FREE", planUntil: null, planExpiredAt: c.planUntil ?? now },
      });
      await notifyUser(
        c.userId,
        "PLAN_EXPIRED",
        "Paketinizin müddəti bitdi",
        "Paketiniz FREE-yə keçdi. Fayllarınız qorunur, amma üst paket imkanları dondurulub. 3 ay ərzində paketi yeniləməsəniz, saxlanan fayllar tamamilə silinəcək.",
        "/merkez/paket",
      );
      downgraded++;
    } catch {
      /* retry next run */
    }
  }

  const expiredDoctors = await prisma.doctorProfile.findMany({
    where: { plan: { not: "FREE" }, planUntil: { lt: now } },
    select: { id: true, userId: true },
  });
  for (const d of expiredDoctors) {
    try {
      await prisma.doctorProfile.update({ where: { id: d.id }, data: { plan: "FREE", planUntil: null } });
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

  // ---- 3) Remind centers ~7 days before their files are deleted ----
  // Deletion happens when planExpiredAt < now-90d, i.e. deadline = planExpiredAt+90d.
  // Warn when the deadline is within 7 days: planExpiredAt in (now-90d, now-83d].
  const warnFrom = new Date(now.getTime() - GRACE_DAYS * DAY);
  const warnTo = new Date(now.getTime() - (GRACE_DAYS - DATA_WARN_DAYS) * DAY);
  const nearDeletion = await prisma.centerProfile.findMany({
    where: { plan: "FREE", planExpiredAt: { gt: warnFrom, lte: warnTo } },
    select: { userId: true, planExpiredAt: true },
  });
  for (const c of nearDeletion) {
    const already = await prisma.notification.findFirst({
      where: { userId: c.userId, type: "PLAN_DATA_WARNING", read: false },
      select: { id: true },
    });
    if (already || !c.planExpiredAt) continue;
    const deadline = c.planExpiredAt.getTime() + GRACE_DAYS * DAY;
    const days = Math.max(1, Math.ceil((deadline - now.getTime()) / DAY));
    await notifyUser(
      c.userId,
      "PLAN_DATA_WARNING",
      "Fayllarınız silinmək üzrədir",
      `Paket ${days} gün sonra bərpa edilməzsə, saxlanan bütün rentgen faylları həmişəlik silinəcək. Yeniləyib faylları qoruyun.`,
      "/merkez/paket",
    );
    warned++;
  }

  // ---- 4) Delete files of centers 3+ months past downgrade without renewal ----
  const toPurge = await prisma.centerProfile.findMany({
    where: { plan: "FREE", planExpiredAt: { lte: deleteBefore } },
    select: { id: true, userId: true },
  });
  for (const c of toPurge) {
    try {
      const files = await prisma.rentgenFile.findMany({
        where: { request: { centerId: c.id } },
        select: { id: true, key: true },
      });
      for (const f of files) {
        try {
          await deleteObject(f.key);
        } catch {
          /* object may already be gone */
        }
      }
      await prisma.rentgenFile.deleteMany({ where: { request: { centerId: c.id } } });
      // Clear the flag so this doesn't run again for the same center.
      await prisma.centerProfile.update({ where: { id: c.id }, data: { planExpiredAt: null } });
      if (files.length) {
        await notifyUser(
          c.userId,
          "PLAN_DATA_WARNING",
          "Saxlanan fayllar silindi",
          "Paket 3 ay ərzində yenilənmədiyi üçün saxlanan rentgen faylları silindi.",
          "/merkez/paket",
        );
      }
      filesPurged += files.length;
    } catch {
      /* retry next run */
    }
  }

  return NextResponse.json({ ok: true, downgraded, warned, filesPurged });
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
