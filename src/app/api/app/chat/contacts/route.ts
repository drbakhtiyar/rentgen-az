import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveAppParticipant, appGetContacts, type AppRole } from "@/lib/app-chat";

export const dynamic = "force-dynamic";

/**
 * GET /api/app/chat/contacts?phone=&role= — the caller's chat list:
 * AI (pinned) + Dəstək (pinned) + every ACCEPTED partner, with last message,
 * preview and unread count. App-key protected, no-store.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  const params = new URL(req.url).searchParams;
  const phone = params.get("phone") ?? "";
  const role = (params.get("role") ?? "").toUpperCase();
  const wantRole = role === "CENTER" || role === "DOCTOR" ? (role as AppRole) : undefined;
  if (nationalDigits(phone).length < 7) {
    return NextResponse.json({ ok: false, error: "phone tələb olunur" }, { status: 400 });
  }
  try {
    const p = await resolveAppParticipant(phone, wantRole);
    if (!p) return NextResponse.json({ ok: false, error: "hesab tapılmadı" }, { status: 404 });
    const contacts = await appGetContacts(p);
    return NextResponse.json({ ok: true, contacts }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/app/chat/contacts]", e);
    return NextResponse.json({ ok: false, error: "yüklənmədi" }, { status: 502 });
  }
}
