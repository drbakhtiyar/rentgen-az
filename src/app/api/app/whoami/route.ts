import { NextResponse } from "next/server";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { getAppAccountForPhone, type WantedRole } from "@/lib/app-catalog";

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
