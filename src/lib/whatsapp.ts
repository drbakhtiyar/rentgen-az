import "server-only";

/**
 * WhatsApp Business (Meta Cloud API) göndərmə qatı.
 *
 * ENV GƏLƏNƏ QƏDƏR PASSİVDİR (Google Places / APNs nümunəsi ilə):
 *   WHATSAPP_TOKEN        — Cloud API access token
 *   WHATSAPP_PHONE_ID     — göndərən nömrənin phone_number_id-si
 *   WHATSAPP_VERIFY_TOKEN — webhook doğrulama üçün bizim seçdiyimiz sirr
 *   WHATSAPP_APP_SECRET   — gələn webhook imzasının yoxlanması (X-Hub-Signature-256)
 * Hamısı Meta Business qurulumundan sonra Vercel env-ə əlavə olunacaq.
 */

export function waConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

/** Mətn mesajı göndər (yalnız 24 saatlıq cavab pəncərəsində — bot halımız). */
export async function sendWaText(
  to: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!waConfigured()) return { ok: false, error: "WhatsApp env qurulmayıb" };
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/\D/g, ""),
          type: "text",
          text: { body: body.slice(0, 4000), preview_url: true },
        }),
      },
    );
    if (!res.ok) {
      console.error("[whatsapp] send failed:", res.status, await res.text().catch(() => ""));
      return { ok: false, error: `Meta API ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[whatsapp] send error:", (e as Error).message);
    return { ok: false, error: String(e) };
  }
}
