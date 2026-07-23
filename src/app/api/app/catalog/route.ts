import { NextResponse } from "next/server";
import { requireAppKey } from "@/lib/app-api";
import { getAppCatalog } from "@/lib/app-catalog";

export const dynamic = "force-dynamic";

/** GET /api/app/catalog — full catalog for the mobile app (app-key protected). */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;
  try {
    const payload = await getAppCatalog();
    // Key-protected → never CDN-cache publicly (would leak to keyless callers).
    return NextResponse.json({ ...payload, source: "site" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[api/app/catalog]", e);
    return NextResponse.json({ ok: false, error: "catalog failed" }, { status: 502 });
  }
}
