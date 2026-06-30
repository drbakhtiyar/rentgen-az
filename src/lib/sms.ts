import "server-only";
import { env } from "./env";

export type SendSmsResult = { ok: boolean; error?: string };

/**
 * Pluggable SMS sender. Provider chosen via SMS_PROVIDER env var.
 * - "dev":     logs the message to the server console (no real SMS). Default.
 * - "twilio":  sends via Twilio REST API.
 * - "generic": POSTs JSON { to, message, sender } to any HTTP SMS gateway
 *              (e.g. an Azerbaijani provider). Configure SMS_GENERIC_URL/TOKEN.
 */
export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  switch (env.smsProvider) {
    case "twilio":
      return sendViaTwilio(to, message);
    case "generic":
      return sendViaGeneric(to, message);
    case "dev":
    default:
      console.log(
        `\n[SMS:dev] → ${to}\n[SMS:dev] ${message}\n(Set SMS_PROVIDER to a real provider in production.)\n`,
      );
      return { ok: true };
  }
}

export async function sendOtpSms(to: string, code: string): Promise<SendSmsResult> {
  const message = `Rentgen.az təsdiq kodunuz: ${code}. Kod 5 dəqiqə etibarlıdır. Kodu heç kimlə paylaşmayın.`;
  return sendSms(to, message);
}

async function sendViaTwilio(to: string, message: string): Promise<SendSmsResult> {
  const { sid, token, from } = env.twilio;
  if (!sid || !token || !from) {
    return { ok: false, error: "Twilio konfiqurasiyası natamamdır." };
  }
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: message }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Twilio xətası: ${res.status} ${body}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Twilio sorğusu uğursuz oldu: ${String(e)}` };
  }
}

async function sendViaGeneric(to: string, message: string): Promise<SendSmsResult> {
  const { url, token, sender } = env.smsGeneric;
  if (!url) return { ok: false, error: "SMS gateway URL təyin edilməyib." };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ to, message, sender: sender || undefined }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `SMS gateway xətası: ${res.status} ${body}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `SMS sorğusu uğursuz oldu: ${String(e)}` };
  }
}
