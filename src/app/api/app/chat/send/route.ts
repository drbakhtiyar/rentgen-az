import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveAppParticipant, appSendMessage, type AppRole } from "@/lib/app-chat";

export const dynamic = "force-dynamic";

/**
 * POST /api/app/chat/send — send a text message to a partner. Pass an existing
 * `conversationId`, or a partner `peerId` (the other party's profile id) to
 * open the conversation on first send. Only ACCEPTED partners. App-key
 * protected. Body: { phone, role, conversationId?|peerId?, content }.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: { phone?: string; role?: string; conversationId?: string; peerId?: string; content?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const phone = body.phone?.trim() ?? "";
  const role = (body.role ?? "").toUpperCase();
  const wantRole = role === "CENTER" || role === "DOCTOR" ? (role as AppRole) : undefined;
  if (nationalDigits(phone).length < 7) {
    return NextResponse.json({ ok: false, error: "phone tələb olunur" }, { status: 400 });
  }
  try {
    const p = await resolveAppParticipant(phone, wantRole);
    if (!p) return NextResponse.json({ ok: false, error: "hesab tapılmadı" }, { status: 404 });
    const result = await appSendMessage(p, {
      conversationId: body.conversationId,
      peerId: body.peerId,
      content: body.content ?? "",
    });
    return NextResponse.json(result, {
      status: result.ok ? 200 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[api/app/chat/send]", e);
    return NextResponse.json({ ok: false, error: "göndərilmədi" }, { status: 502 });
  }
}
