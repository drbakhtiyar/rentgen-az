import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { getAppAccountForPhone, type WantedRole } from "@/lib/app-catalog";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

const ROLES: WantedRole[] = ["DOCTOR", "CENTER", "PATIENT"];

export const dynamic = "force-dynamic";

/**
 * GET /api/app/whoami?phone= — the account for ONE phone (login resolver).
 * Lets the app resolve who signed in without downloading the whole registry
 * (which would expose every doctor/center phone). App-key protected, no-store.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  // Nömrə enumerasiyası qorunması (2026-08-14): app açarı statikdir və
  // tətbiqdən çıxarıla bilər — IP başına dəqiqədə 20 sorğu real istifadəyə
  // (giriş ekranı) bəs edir, kütləvi nömrə skanını isə dayandırır.
  const rl = await rateLimit("app:whoami", clientIp(req), 20, 60);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterSec) as unknown as NextResponse;

  const params = new URL(req.url).searchParams;
  const phone = params.get("phone") ?? "";
  const roleRaw = (params.get("role") ?? "").toUpperCase();
  const role = ROLES.includes(roleRaw as WantedRole) ? (roleRaw as WantedRole) : undefined;
  if (nationalDigits(phone).length < 7) {
    return NextResponse.json({ ok: false, error: "phone tələb olunur" }, { status: 400 });
  }
  try {
    const account = await getAppAccountForPhone(phone, role);
    return NextResponse.json({ ok: true, account: account ?? null }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[api/app/whoami]", e);
    return NextResponse.json({ ok: false, error: "whoami failed" }, { status: 502 });
  }
}
