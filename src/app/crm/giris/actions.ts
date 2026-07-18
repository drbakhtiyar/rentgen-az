"use server";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { setSessionCookie } from "@/lib/auth/session";

export type CrmLoginResult = { ok: boolean; error?: string; devCode?: string };

/**
 * CRM login is phone-only (no role tabs): the system itself works out whether
 * the phone belongs to a center owner or to a center assistant. Anyone else
 * is rejected — assistants never appear on the public site or its login.
 */
async function resolveCrmRole(
  phone: string,
): Promise<{ userId: string; role: "CENTER" | "ASSISTANT" } | null> {
  const user = await prisma.user.findUnique({
    where: { phone },
    select: {
      id: true,
      isBlocked: true,
      centerProfile: { select: { id: true } },
      assistantOf: { select: { id: true, active: true } },
    },
  });
  if (!user || user.isBlocked) return null;
  if (user.centerProfile) return { userId: user.id, role: "CENTER" };
  if (user.assistantOf?.active) return { userId: user.id, role: "ASSISTANT" };
  return null;
}

/** Step 1: send the OTP — only to phones that actually have CRM access. */
export async function requestCrmOtpAction(input: { phone: string }): Promise<CrmLoginResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };
  const who = await resolveCrmRole(phone);
  if (!who) {
    return { ok: false, error: "Bu nömrə üçün CRM girişi yoxdur. Mərkəz sahibi sizi asistent kimi əlavə etməlidir." };
  }
  try {
    const r = await createOtp(phone);
    if (!r.ok) return { ok: false, error: r.error };
    const sms = await sendOtpSms(phone, r.code);
    if (!sms.ok) return { ok: false, error: "SMS göndərilə bilmədi. Yenidən cəhd edin." };
    return { ok: true, devCode: env.smsProvider === "dev" ? r.code : undefined };
  } catch {
    return { ok: false, error: "Texniki xəta. Bir azdan yenidən cəhd edin." };
  }
}

/** Step 2: verify the OTP and open the right session (owner or assistant). */
export async function verifyCrmOtpAction(input: { phone: string; code: string }): Promise<CrmLoginResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "Telefon nömrəsi düzgün deyil." };
  const v = await verifyOtp(phone, input.code.trim());
  if (!v.ok) return { ok: false, error: v.error };

  const who = await resolveCrmRole(phone);
  if (!who) return { ok: false, error: "Bu nömrə üçün CRM girişi yoxdur." };

  await prisma.user.update({
    where: { id: who.userId },
    data: { role: who.role, lastLoginAt: new Date() },
  });
  await setSessionCookie({ userId: who.userId, role: who.role, phone });
  return { ok: true };
}
