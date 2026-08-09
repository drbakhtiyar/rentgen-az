import { NextResponse } from "next/server";
import { getSmsBalance } from "@/lib/sms";

export const dynamic = "force-dynamic";

/**
 * Axiora admin paneli üçün SMS balansı. Lsim parolu bu serverdən kənara
 * çıxmır — panel yalnız hazır rəqəmi görür. PANEL_SHARED_SECRET ilə qorunur.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.PANEL_SHARED_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const balance = await getSmsBalance();
  return NextResponse.json({ ok: true, balance });
}
