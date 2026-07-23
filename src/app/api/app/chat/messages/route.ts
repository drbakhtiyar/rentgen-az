import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveAppParticipant, appFetchThread, type AppRole } from "@/lib/app-chat";

export const dynamic = "force-dynamic";

/**
 * GET /api/app/chat/messages?phone=&role=&conversationId=  (or &peerId=)
 * Recent messages of a partner conversation, marking the other party's
 * messages as read. Accepts `peerId` (the other party's profile id) when the
 * app has no conversationId yet — it resolves the thread and echoes the
 * `conversationId` back. Polling endpoint. App-key protected, no-store.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  const params = new URL(req.url).searchParams;
  const phone = params.get("phone") ?? "";
  const role = (params.get("role") ?? "").toUpperCase();
  const conversationId = params.get("conversationId") ?? "";
  const peerId = params.get("peerId") ?? "";
  const wantRole = role === "CENTER" || role === "DOCTOR" ? (role as AppRole) : undefined;
  if (nationalDigits(phone).length < 7 || (!conversationId && !peerId)) {
    return NextResponse.json({ ok: false, error: "phone və conversationId/peerId tələb olunur" }, { status: 400 });
  }
  try {
    const p = await resolveAppParticipant(phone, wantRole);
    if (!p) return NextResponse.json({ ok: false, error: "hesab tapılmadı" }, { status: 404 });
    const result = await appFetchThread(p, { conversationId, peerId });
    if (!result.ok) return NextResponse.json(result, { status: 403 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/app/chat/messages]", e);
    return NextResponse.json({ ok: false, error: "yüklənmədi" }, { status: 502 });
  }
}
