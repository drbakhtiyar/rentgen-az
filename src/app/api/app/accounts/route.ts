import { NextResponse } from "next/server";
import { requireAppKey } from "@/lib/app-api";
import { getAppAccounts } from "@/lib/app-catalog";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/app/accounts — sign-in registry (doctors + centers). App-key protected. */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  // Bütün həkim/mərkəz nömrələrini verir — legitim tətbiq bunu nadir çağırır; saatda 3 kütləvi çıxarmanı dayandırır.
  const rl = await rateLimit("app:accounts", clientIp(req), 3, 3600);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterSec) as unknown as NextResponse;
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
