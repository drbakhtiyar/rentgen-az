/**
 * Premium xidmət ikonları (2026-08-13) — ChatGPT-də yaradılıb, vahid tünd
 * fona normallaşdırılıb (gpt-image-1 edits), Vercel Blob-da saxlanılır.
 * DB-yə YAZILMIR (baza canlı saytla ortaqdır; canlı köhnə dizayndadır) —
 * demo mərhələsində xəritə kod tərəfindədir. Tam seriya hazır olanda
 * Service.iconUrl-ə köçürülə bilər.
 */
const BLOB = "https://e0laauvwfyekwbiy.public.blob.vercel-storage.com/service-icons";

export const SERVICE_ICON_URLS: Record<string, string> = {
  "bud-rentgeni": `${BLOB}/bud-rentgeni.png`,
  "diz-rentgeni": `${BLOB}/diz-rentgeni.png`,
  "baldir-rentgeni": `${BLOB}/baldir-rentgeni.png`,
  "topuq-rentgeni": `${BLOB}/topuq-rentgeni.png`,
  "ayaq-rentgeni": `${BLOB}/ayaq-rentgeni.png`,
  "ayaq-barmaqlari-rentgeni": `${BLOB}/ayaq-barmaqlari-rentgeni.png`,
  "daban-rentgeni": `${BLOB}/daban-rentgeni.png`,
};
