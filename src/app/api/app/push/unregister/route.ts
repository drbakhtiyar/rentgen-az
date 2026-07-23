import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAppKey } from "@/lib/app-api";

export const dynamic = "force-dynamic";

/**
 * POST /api/app/push/unregister — the app drops a device token on sign-out,
 * so a shared phone stops receiving the previous account's pushes. Deleting by
 * token alone is safe (the token uniquely identifies the device). App-key
 * protected. Body: { token }.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: { token?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const token = body.token?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "token tələb olunur" }, { status: 400 });
  }

  try {
    await prisma.pushToken.deleteMany({ where: { token } });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/app/push/unregister]", e);
    return NextResponse.json({ ok: false, error: "silinmədi" }, { status: 502 });
  }
}
