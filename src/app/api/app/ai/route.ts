import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveUserIdByPhone } from "@/lib/app-catalog";
import { askAssistant, type AiMsg } from "@/lib/ai-assistant";

export const dynamic = "force-dynamic";

/**
 * POST /api/app/ai — the AI Yardımçı. Same helper the site uses (Claude Haiku).
 * Stateless: the app sends the running history, the last turn being the new
 * question. App-key protected + phone must resolve to a real user.
 * Body: { phone, messages:[{role:"user"|"assistant", content}] }.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: { phone?: string; messages?: AiMsg[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const phone = body.phone?.trim() ?? "";
  if (nationalDigits(phone).length < 7) {
    return NextResponse.json({ ok: false, error: "phone tələb olunur" }, { status: 400 });
  }

  // Sanitize history: keep valid turns, cap length, last must be a user question.
  const history: AiMsg[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 1500) }));
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ ok: false, error: "sual tələb olunur" }, { status: 400 });
  }

  try {
    const userId = await resolveUserIdByPhone(phone);
    if (!userId) return NextResponse.json({ ok: false, error: "hesab tapılmadı" }, { status: 404 });
    const result = await askAssistant(history);
    return NextResponse.json(result, {
      status: result.ok ? 200 : 502,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[api/app/ai]", e);
    return NextResponse.json({ ok: false, error: "AI cavab verə bilmədi" }, { status: 502 });
  }
}
