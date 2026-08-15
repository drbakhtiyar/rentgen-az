import { NextResponse } from "next/server";
import { requireAppKey } from "@/lib/app-api";
import { getAppAccounts } from "@/lib/app-catalog";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/app/accounts — sign-in registry (doctors + centers). App-key protected. */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  // Bütün həkim/mərkəz nömrələrini verir — legitim tətbiq bunu nadir çağırır; saatda 3 kütləvi çıxarmanı dayandırır.
  const rl = await rateLimit("app:accounts", clientIp(req), 3, 3600);
  if (!rl.allowed) return tooManyRequests(rl.retryAfterSec) as unknown as NextResponse;
  // İSTİFADƏ ÖLÇÜSÜ (2026-08-14): bu endpoint bütün həkim/mərkəz nömrələrini
  // verir və `whoami` ilə əvəzlənib. Söndürməzdən əvvəl köhnə tətbiq
  // versiyalarının hələ çağırıb-çağırmadığını bilmək lazımdır — hər çağırış
  // jurnala düşür (gündə bir sətir: eyni gün təkrarlar birləşdirilir).
  try {
    const day = new Date().toISOString().slice(0, 10);
    const already = await prisma.adminActionLog.findFirst({
      where: { action: "api:accounts_used", targetId: day },
      select: { id: true },
    });
    if (!already) {
      await prisma.adminActionLog.create({
        data: {
          action: "api:accounts_used",
          targetType: "ApiEndpoint",
          targetId: day,
          meta: { ua: req.headers.get("user-agent")?.slice(0, 200) ?? null },
        },
      });
    }
  } catch {
    /* ölçmə heç vaxt cavabı pozmur */
  }

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
