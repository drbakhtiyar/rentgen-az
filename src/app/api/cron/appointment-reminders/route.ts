import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendCenterSms } from "@/lib/center-sms";
import { formatDateTimeAz } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HOUR = 60 * 60 * 1000;
const MAX_LOOKAHEAD_H = 168; // 1 week — the largest reminderHours we support
const BATCH = 500;

/**
 * Hourly cron: SMS appointment reminders. For centers that enabled reminders
 * (remindersEnabled), any upcoming appointment (NEW/CONTACTED) that is now
 * within the center's `reminderHours` window and hasn't been reminded yet gets
 * one SMS. `reminderSentAt` dedupes. Protected by CRON_SECRET.
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
  const lookahead = new Date(now.getTime() + MAX_LOOKAHEAD_H * HOUR);

  const candidates = await prisma.appointmentRequest.findMany({
    where: {
      preferredDate: { gt: now, lte: lookahead },
      reminderSentAt: null,
      status: { in: ["NEW", "CONTACTED"] },
      center: { remindersEnabled: true },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      preferredDate: true,
      centerId: true,
      center: { select: { name: true, reminderHours: true } },
    },
    orderBy: { preferredDate: "asc" },
    take: BATCH,
  });

  let sent = 0;
  let failed = 0;
  let noBalance = 0;
  for (const a of candidates) {
    if (!a.preferredDate || !a.center || !a.centerId) continue;
    const hoursUntil = (a.preferredDate.getTime() - now.getTime()) / HOUR;
    if (hoursUntil > (a.center.reminderHours || 24)) continue; // not yet in window

    const when = formatDateTimeAz(a.preferredDate);
    const msg = `Salam! ${a.center.name} - randevunuz: ${when}. Xatırladırıq. Dəyişiklik üçün mərkəzlə əlaqə saxlayın.`;
    // Charged from the center's SMS balance. Out of credits → skip WITHOUT
    // stamping, so the reminder still goes out if they top up in time.
    const res = await sendCenterSms(a.centerId, a.phone, msg, "reminder");
    if (!res.ok && "noBalance" in res) {
      noBalance++;
      continue;
    }
    // Stamp regardless so a persistently failing number isn't retried forever.
    await prisma.appointmentRequest.update({
      where: { id: a.id },
      data: { reminderSentAt: new Date() },
    });
    if (res.ok) sent++;
    else failed++;
  }

  return NextResponse.json({ ok: true, considered: candidates.length, sent, failed, noBalance });
}
