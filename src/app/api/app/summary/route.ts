import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveAppParticipant, getAppSummary, type AppRole } from "@/lib/app-chat";

export const dynamic = "force-dynamic";

/**
 * GET /api/app/summary?phone=&role= — cheap counts for the home-screen widget
 * and Siri intents: `{ ok, newRequests, unread }`. `newRequests` = NEW requests
 * (a center's incoming, or a doctor's referrals); `unread` = total unread chat.
 * App-key protected, no-store.
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
    const summary = await getAppSummary(p);
    return NextResponse.json({ ok: true, ...summary }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/app/summary]", e);
    return NextResponse.json({ ok: false, error: "yüklənmədi" }, { status: 502 });
  }
}
