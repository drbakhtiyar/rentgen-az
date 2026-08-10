"use server";

import { answerWaMessage, botTestToken } from "@/lib/wa-bot";

export type BotTestState = { ok: boolean; answer?: string; error?: string };

/**
 * Bot sınaq çatı — gizli tokenli, girişsiz (linki yalnız admin paylaşır).
 * Real WhatsApp axını ilə EYNİ funksiyanı çağırır (answerWaMessage): eyni sərt
 * qaydalar, eyni bilik bazası, eyni markdown təmizliyi — yəni test = realın
 * birəbir simulyasiyası. Nömrə konteksti yoxdur (naməlum nömrə kimi).
 */
export async function askBotTestAction(input: {
  token: string;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<BotTestState> {
  if (input.token !== botTestToken()) return { ok: false, error: "Link keçərli deyil." };
  const msg = (input.message ?? "").trim();
  if (!msg) return { ok: false, error: "Mesaj boşdur." };

  const history = (input.history ?? [])
    .slice(-10)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1500) }));

  const res = await answerWaMessage("+994000000000", msg, history);
  if (!res.ok || !res.answer)
    return { ok: false, error: "Bot hazırda cavab verə bilmir (AI balansı və ya texniki xəta). Bir azdan yenidən yoxlayın." };
  return { ok: true, answer: res.answer };
}
