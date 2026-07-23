import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveUserIdByPhone } from "@/lib/app-catalog";
import { appSendSupport } from "@/lib/app-chat";

export const dynamic = "force-dynamic";

/**
 * POST /api/app/support/send — the user sends a message to rentgen.az support
 * (admin thread). Admin replies from the site's Söhbətlər panel. App-key
 * protected. Body: { phone, content }.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: { phone?: string; content?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const phone = body.phone?.trim() ?? "";
  if (nationalDigits(phone).length < 7) {
    return NextResponse.json({ ok: false, error: "phone tələb olunur" }, { status: 400 });
  }
  try {
    const userId = await resolveUserIdByPhone(phone);
    if (!userId) return NextResponse.json({ ok: false, error: "hesab tapılmadı" }, { status: 404 });
    const result = await appSendSupport(userId, body.content ?? "");
    return NextResponse.json(result, {
      status: result.ok ? 200 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[api/app/support/send]", e);
    return NextResponse.json({ ok: false, error: "göndərilmədi" }, { status: 502 });
  }
}
