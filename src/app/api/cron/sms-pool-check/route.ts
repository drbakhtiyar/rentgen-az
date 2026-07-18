import { NextResponse } from "next/server";
import { getSmsBalance, alertAdminSms } from "@/lib/sms";
import { ADMIN_SMS_RESERVE } from "@/lib/center-sms";

export const dynamic = "force-dynamic";

/**
 * Daily cron: SMS stock watch. Centers buy SMS packages out of the platform's
 * Lsim pool; at least ADMIN_SMS_RESERVE units are always kept for the platform
 * itself. When the pool falls to (or below) the reserve, the admin gets an SMS
 * — and keeps getting one every 24h until the pool is topped up.
 * Protected by CRON_SECRET.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const pool = await getSmsBalance();
  if (pool == null) {
    return NextResponse.json({ ok: true, pool: null, alerted: false, note: "provider unreachable" });
  }

  let alerted = false;
  if (pool <= ADMIN_SMS_RESERVE) {
    await alertAdminSms(
      `rentgen.az: Lsim SMS balansı ${pool}-ə düşüb (rezerv: ${ADMIN_SMS_RESERVE}). SMS almaq lazımdır — mərkəzlərə satış dayanıb.`,
    );
    alerted = true;
  }

  return NextResponse.json({ ok: true, pool, alerted });
}
