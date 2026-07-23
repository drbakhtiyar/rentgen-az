import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveUserIdByPhone } from "@/lib/app-catalog";
import { appFetchSupport } from "@/lib/app-chat";

export const dynamic = "force-dynamic";

/**
 * GET /api/app/support/messages?phone= — the user's rentgen.az support (admin)
 * thread; marks admin messages as read. Polling endpoint. App-key protected.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  const phone = new URL(req.url).searchParams.get("phone") ?? "";
  if (nationalDigits(phone).length < 7) {
    return NextResponse.json({ ok: false, error: "phone tələb olunur" }, { status: 400 });
  }
  try {
    const userId = await resolveUserIdByPhone(phone);
    if (!userId) return NextResponse.json({ ok: false, error: "hesab tapılmadı" }, { status: 404 });
    const messages = await appFetchSupport(userId);
    return NextResponse.json({ ok: true, messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/app/support/messages]", e);
    return NextResponse.json({ ok: false, error: "yüklənmədi" }, { status: 502 });
  }
}
