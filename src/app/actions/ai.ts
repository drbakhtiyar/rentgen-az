"use server";

import { getCurrentUser } from "@/lib/auth/rbac";
import { askAssistant, type AiMsg } from "@/lib/ai-assistant";

const MAX_TURNS = 12;
const MAX_LEN = 1500;

/** Panel-only AI helper (center, doctor, assistant, admin). Conversation lives
 * client-side; we just answer the trimmed history. */
export async function askAiAssistantAction(
  history: { role: "user" | "assistant"; content: string }[],
): Promise<{ ok: boolean; answer?: string; error?: string }> {
  const me = await getCurrentUser();
  if (!me || !["CENTER", "DOCTOR", "ASSISTANT", "ADMIN"].includes(me.role)) {
    return { ok: false, error: "Giriş tələb olunur." };
  }
  const msgs: AiMsg[] = history
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_LEN) }));
  if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") {
    return { ok: false, error: "Sual boşdur." };
  }
  return askAssistant(msgs);
}
