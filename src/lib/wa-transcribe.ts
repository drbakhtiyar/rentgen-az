import "server-only";

/**
 * WhatsApp səsli mesaj transkripti (2026-08-12, istifadəçi sifarişi).
 *
 * Axın: webhook-dan gələn audio media_id → Graph API-dən qısaömürlü media URL
 * → faylı endir (eyni Bearer token) → OpenAI transcriptions endpointi ilə
 * azərbaycanca mətnə çevir → mətn bota (answerWaMessage) verilir.
 *
 * Anthropic API səs qəbul etmir, ona görə STT ayrıca provayderdir.
 * `OPENAI_API_KEY` env qurulana qədər PASSİVDİR (APNS/LSIM naxışı) —
 * webhook köhnə sabit "yazı ilə göndərin" cavabına düşür.
 */

const GRAPH = "https://graph.facebook.com/v21.0";
// gpt-4o-mini-transcribe: whisper-1-dən ucuz və AZ dilində keyfiyyətli.
const DEFAULT_MODEL = "gpt-4o-mini-transcribe";
// WhatsApp səsli mesajları adətən kiçikdir (ogg/opus); 16 MB üstü gözlənilmir.
const MAX_BYTES = 16 * 1024 * 1024;

export function transcribeConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY && process.env.WHATSAPP_TOKEN);
}

function fileExt(mime: string): string {
  if (mime.includes("ogg") || mime.includes("opus")) return "ogg";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "m4a";
  if (mime.includes("amr")) return "amr";
  if (mime.includes("wav")) return "wav";
  return "ogg";
}

/** media_id → transkript mətni; hər hansı mərhələ alınmasa null (bot sabit cavaba düşür). */
export async function transcribeWaAudio(mediaId: string): Promise<string | null> {
  const waToken = process.env.WHATSAPP_TOKEN;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!waToken || !apiKey || !mediaId) return null;
  try {
    const metaRes = await fetch(`${GRAPH}/${encodeURIComponent(mediaId)}`, {
      headers: { Authorization: `Bearer ${waToken}` },
    });
    if (!metaRes.ok) {
      console.error("[wa-transcribe] media meta", metaRes.status);
      return null;
    }
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string };
    if (!meta.url) return null;

    // Media URL qısaömürlüdür və yalnız eyni token ilə açılır.
    const audioRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${waToken}` } });
    if (!audioRes.ok) {
      console.error("[wa-transcribe] media download", audioRes.status);
      return null;
    }
    const buf = await audioRes.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > MAX_BYTES) return null;

    const mime = (meta.mime_type ?? "audio/ogg").split(";")[0].trim();
    const form = new FormData();
    form.append("file", new Blob([buf], { type: mime }), `voice.${fileExt(mime)}`);
    form.append("model", process.env.WA_TRANSCRIBE_MODEL || DEFAULT_MODEL);
    // Dil ipucu — mesajların hamısı azərbaycancadır; RU/EN gələrsə də model tanıyır.
    form.append("language", "az");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      console.error("[wa-transcribe] openai", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { text?: string };
    const text = data.text?.trim();
    return text || null;
  } catch (e) {
    console.error("[wa-transcribe]", (e as Error).message);
    return null;
  }
}
