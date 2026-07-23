import { NextResponse } from "next/server";
import { requireAppKey } from "@/lib/app-api";
import { getAppAccounts } from "@/lib/app-catalog";

export const dynamic = "force-dynamic";

/** GET /api/app/accounts — sign-in registry (doctors + centers). App-key protected. */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;
  try {
    const accounts = await getAppAccounts();
    // Key-protected (exposes phone numbers) → never CDN-cache publicly.
    return NextResponse.json({ ok: true, accounts, source: "site" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[api/app/accounts]", e);
    return NextResponse.json({ ok: false, error: "accounts failed" }, { status: 502 });
  }
}
