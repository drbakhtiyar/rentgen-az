import { NextResponse } from "next/server";
import { requireAppKey } from "@/lib/app-api";
import { normalizePhone } from "@/lib/phone";
import { createOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * POST /api/app/referrals/otp — send an OTP to the PATIENT's phone so a doctor's
 * referral can confirm the number is real (same flow as the site's referral).
 * Body: { patientPhone }. App-key protected. In dev, returns the code.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: { patientPhone?: string; phone?: string };
  try {
    body = (await req.json()) as { patientPhone?: string; phone?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const phone = normalizePhone(body.patientPhone ?? body.phone ?? "");
  if (!phone) return NextResponse.json({ ok: false, error: "pasiyent nömrəsi düzgün deyil" }, { status: 400 });

  try {
    const r = await createOtp(phone);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 429 });
    const sms = await sendOtpSms(phone, r.code);
    if (!sms.ok) return NextResponse.json({ ok: false, error: "SMS göndərilə bilmədi" }, { status: 502 });
    return NextResponse.json({ ok: true, devCode: env.smsProvider === "dev" ? r.code : null });
  } catch (e) {
    console.error("[api/app/referrals/otp]", e);
    return NextResponse.json({ ok: false, error: "texniki xəta" }, { status: 502 });
  }
}
