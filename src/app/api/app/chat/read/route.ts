import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveAppParticipant, appMarkRead, type AppRole } from "@/lib/app-chat";

export const dynamic = "force-dynamic";

/**
 * POST /api/app/chat/read — mark a thread read when the user opens it, and
 * return the fresh total unread badge so the app can zero its Söhbətlər badge
 * instantly (no waiting for the next contacts poll). Body:
 *   { phone, role, conversationId }  — a partner conversation, or
 *   { phone, role, support: true }   — the rentgen.az support thread.
 * App-key protected, no-store. Idempotent.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: { phone?: string; role?: string; conversationId?: string; support?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const phone = body.phone?.trim() ?? "";
  const role = (body.role ?? "").toUpperCase();
  const wantRole = role === "CENTER" || role === "DOCTOR" ? (role as AppRole) : undefined;
  if (nationalDigits(phone).length < 7 || (!body.conversationId && !body.support)) {
    return NextResponse.json({ ok: false, error: "phone və conversationId/support tələb olunur" }, { status: 400 });
  }
  try {
    const p = await resolveAppParticipant(phone, wantRole);
    if (!p) return NextResponse.json({ ok: false, error: "hesab tapılmadı" }, { status: 404 });
    const result = await appMarkRead(p, { conversationId: body.conversationId, support: body.support });
    return NextResponse.json(result, {
      status: result.ok ? 200 : 403,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[api/app/chat/read]", e);
    return NextResponse.json({ ok: false, error: "alınmadı" }, { status: 502 });
  }
}
