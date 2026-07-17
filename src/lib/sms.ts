import "server-only";
import { createHash } from "crypto";
import { env } from "./env";
import { prisma } from "./db";

export type SendSmsResult = { ok: boolean; error?: string };
export type SmsKind = "otp" | "center_request" | "patient_status" | "reminder" | "other";

/**
 * Pluggable SMS sender. Provider chosen via SMS_PROVIDER env var.
 * - "dev":     logs the message to the server console (no real SMS). Default.
 * - "twilio":  sends via Twilio REST API.
 * - "generic": POSTs JSON { to, message, sender } to any HTTP SMS gateway.
 * - "lsim":    Lsim.az / sendsms.az QuickSMS HTTP API (Azerbaijan).
 * Every send is recorded to SmsLog (best-effort) for the admin panel.
 */
export async function sendSms(
  to: string,
  message: string,
  kind: SmsKind = "other",
): Promise<SendSmsResult> {
  let result: SendSmsResult;
  switch (env.smsProvider) {
    case "twilio":
      result = await sendViaTwilio(to, message);
      break;
    case "generic":
      result = await sendViaGeneric(to, message);
      break;
    case "lsim":
      result = await sendViaLsim(to, message);
      break;
    case "dev":
    default:
      console.log(
        `\n[SMS:dev] → ${to}\n[SMS:dev] ${message}\n(Set SMS_PROVIDER to a real provider in production.)\n`,
      );
      result = { ok: true };
  }
  await logSms(to, message, kind, result);
  return result;
}

/**
 * Fire-and-forget SMS alert to the platform admin (e.g. a new center/doctor is
 * awaiting approval). Number configurable via ADMIN_ALERT_PHONE. Never throws.
 */
export async function alertAdminSms(message: string): Promise<void> {
  const to = process.env.ADMIN_ALERT_PHONE || "+994505010107";
  try {
    await sendSms(to, message, "other");
  } catch {
    /* best-effort */
  }
}

/** Records a send to SmsLog. OTP codes are masked. Never throws. */
async function logSms(
  to: string,
  message: string,
  kind: SmsKind,
  result: SendSmsResult,
): Promise<void> {
  try {
    // Mask the numeric OTP code so the admin log never exposes live codes.
    const text = kind === "otp" ? message.replace(/\d{4,6}/, "****") : message;
    await prisma.smsLog.create({
      data: {
        phone: to,
        kind,
        text,
        ok: result.ok,
        error: result.error ?? null,
        provider: env.smsProvider,
      },
    });
  } catch {
    /* logging is best-effort — never block the SMS flow */
  }
}

/** Current SMS balance (units). Returns null if unsupported/unavailable. */
export async function getSmsBalance(): Promise<number | null> {
  if (env.smsProvider !== "lsim") return null;
  const { login, password } = env.lsim;
  if (!login || !password) return null;
  try {
    const key = md5(md5(password) + login);
    const url = `https://apps.lsim.az/quicksms/v1/balance?login=${encodeURIComponent(
      login,
    )}&key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = (await res.json().catch(() => null)) as { obj?: number | null } | null;
    return typeof data?.obj === "number" ? data.obj : null;
  } catch {
    return null;
  }
}

function md5(input: string): string {
  return createHash("md5").update(input, "utf8").digest("hex");
}

// Azerbaijani (and a few punctuation) → ASCII, so SMS ship as GSM-7 (160
// chars/segment = 1 credit) instead of Unicode (70 chars/segment = 2 credits).
const ASCII_MAP: Record<string, string> = {
  ə: "e", Ə: "E", ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I",
  ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U",
  "—": "-", "–": "-", "«": '"', "»": '"', "“": '"', "”": '"', "‘": "'", "’": "'", "…": "...",
};

/** Fold text to GSM-7-safe ASCII (drops any remaining non-ASCII). */
export function toGsmAscii(text: string): string {
  return text
    .split("")
    .map((ch) => ASCII_MAP[ch] ?? (ch.charCodeAt(0) > 127 ? "" : ch))
    .join("");
}

// Lsim QuickSMS error codes → readable messages.
const LSIM_ERRORS: Record<number, string> = {
  [-100]: "Yanlış açar (key)",
  [-101]: "Mətn icazə verilən uzunluqdan çoxdur",
  [-102]: "Nömrə formatı yanlışdır",
  [-103]: "Yanlış göndərən adı (sender)",
  [-104]: "Balans kifayət etmir",
  [-105]: "Nömrə qara siyahıdadır",
  [-106]: "Yanlış tranzaksiya ID",
  [-107]: "IP ünvanına icazə yoxdur",
  [-108]: "Yanlış hash",
  [-109]: "Host yoxdur",
  [-110]: "Hesabat limiti aşıldı",
  [-500]: "Daxili xəta",
};

/**
 * Lsim.az QuickSMS single-message send.
 * key = md5( md5(password) + LOGIN + TEXT + MSISDN + SENDER )
 * msisdn format: 994XXXXXXXXX (no '+'). unicode=true for non-ASCII (AZ/RU) text.
 */
async function sendViaLsim(to: string, message: string): Promise<SendSmsResult> {
  const { login, password, sender } = env.lsim;
  if (!login || !password || !sender) {
    return { ok: false, error: "Lsim konfiqurasiyası natamamdır (login/password/sender)." };
  }
  const msisdn = to.replace(/\D/g, ""); // 994XXXXXXXXX
  // Fold to ASCII so each SMS is 1 credit (GSM-7) instead of 2 (Unicode).
  const text = toGsmAscii(message);
  const unicode = text.split("").some((ch) => ch.charCodeAt(0) > 127);
  const key = md5(md5(password) + login + text + msisdn + sender);

  try {
    const res = await fetch("https://apps.lsim.az/quicksms/v1/smssender", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login,
        key,
        msisdn,
        text,
        sender,
        scheduled: "NOW",
        unicode,
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      successMessage?: string | null;
      errorMessage?: string | null;
      obj?: number | null;
      errorCode?: number | null;
    } | null;

    if (!res.ok || !data) {
      return { ok: false, error: `Lsim xətası: HTTP ${res.status}` };
    }
    // Success: a transaction id in `obj`, no error message/code.
    if (data.errorMessage || (typeof data.errorCode === "number" && data.errorCode < 0)) {
      const code = typeof data.errorCode === "number" ? data.errorCode : 0;
      return {
        ok: false,
        error: data.errorMessage || LSIM_ERRORS[code] || `Lsim xəta kodu ${code}`,
      };
    }
    if (data.obj) return { ok: true };
    return { ok: false, error: "Lsim: naməlum cavab." };
  } catch (e) {
    return { ok: false, error: `Lsim sorğusu uğursuz oldu: ${String(e)}` };
  }
}

export async function sendOtpSms(to: string, code: string): Promise<SendSmsResult> {
  const message = `Təsdiq kodunuz: ${code}. Kod 2 dəqiqə etibarlıdır. Kodu heç kimlə paylaşmayın.`;
  return sendSms(to, message, "otp");
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
