import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { resolveUserIdByPhone } from "@/lib/app-catalog";
import { isExpoPushToken } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * POST /api/app/push/register — the app registers a device's Expo push token
 * for the signed-in user, so events (new referral / status / result) can push
 * to it. Idempotent: re-registering the same token just re-points it at the
 * current user (a shared device that switched accounts). App-key protected.
 * Body: { phone, token, platform? }.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  let body: { phone?: string; token?: string; platform?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
  const phone = body.phone?.trim() ?? "";
  const token = body.token?.trim() ?? "";
  const platform = (body.platform ?? "ios").toLowerCase() === "android" ? "android" : "ios";

  if (nationalDigits(phone).length < 7 || !token) {
    return NextResponse.json({ ok: false, error: "phone və token tələb olunur" }, { status: 400 });
  }
  if (!isExpoPushToken(token)) {
    return NextResponse.json({ ok: false, error: "keçərsiz push token" }, { status: 400 });
  }

  try {
    const userId = await resolveUserIdByPhone(phone);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "istifadəçi tapılmadı" }, { status: 404 });
    }
    // Unique on token → move it to this user if it was on another (shared device).
    await prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[api/app/push/register]", e);
    return NextResponse.json({ ok: false, error: "qeydiyyat alınmadı" }, { status: 502 });
  }
}
