import "server-only";
import { env, SITE_URL } from "./env";

export type EmailResult = { ok: boolean; error?: string };

/**
 * Pluggable email sender for internal notifications.
 * - "formsubmit" (default): free relay, no API key. Requires a one-time
 *   activation click on the first email sent to NOTIFY_EMAIL.
 * - "resend": production-grade (RESEND_API_KEY required).
 * - "console": logs only (no delivery).
 */
export async function sendNotificationEmail({
  subject,
  fields,
}: {
  subject: string;
  fields: Record<string, string>;
}): Promise<EmailResult> {
  const to = env.notifyEmail;
  if (!to) {
    console.warn("[email] NOTIFY_EMAIL təyin edilməyib — bildiriş ötürülmədi.");
    return { ok: false, error: "NOTIFY_EMAIL yoxdur" };
  }

  switch (env.emailProvider) {
    case "resend":
      return sendViaResend(to, subject, fields);
    case "console":
      console.log(`[email:console] → ${to}\n${subject}\n`, fields);
      return { ok: true };
    case "formsubmit":
    default:
      return sendViaFormsubmit(to, subject, fields);
  }
}

async function sendViaFormsubmit(
  to: string,
  subject: string,
  fields: Record<string, string>,
): Promise<EmailResult> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // FormSubmit ties activation to the submitting origin.
        Origin: SITE_URL,
        Referer: `${SITE_URL}/`,
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "table",
        _captcha: "false",
        ...fields,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: string };
    if (!res.ok) return { ok: false, error: `formsubmit ${res.status}` };
    // success may be "false" on the very first (activation) submission
    return { ok: data.success === "true", error: data.success !== "true" ? "activation_pending" : undefined };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function sendViaResend(
  to: string,
  subject: string,
  fields: Record<string, string>,
): Promise<EmailResult> {
  if (!env.resend.key) return { ok: false, error: "RESEND_API_KEY yoxdur" };
  const html = `<table style="font-family:sans-serif;font-size:14px">${Object.entries(fields)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0;font-weight:600">${v}</td></tr>`,
    )
    .join("")}</table>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.resend.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.resend.from, to: [to], subject, html }),
    });
    if (!res.ok) return { ok: false, error: `resend ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
