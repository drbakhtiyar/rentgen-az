import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { googleConfigured, refreshRating } from "@/lib/google-rating";

export const dynamic = "force-dynamic";

/**
 * Daily cron: refresh every center's cached Google rating from its Place ID.
 * Centers connect their Google Place in their panel; this keeps the number
 * current. Protected by CRON_SECRET. No-op when the Places key isn't set.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }
  if (!googleConfigured()) {
    return NextResponse.json({ ok: true, updated: 0, note: "GOOGLE_PLACES_API_KEY not set" });
  }

  const centers = await prisma.centerProfile.findMany({
    where: { googlePlaceId: { not: null } },
    select: { id: true, googlePlaceId: true },
  });

  let updated = 0;
  let failed = 0;
  for (const c of centers) {
    const res = await refreshRating(c.googlePlaceId!);
    if ("error" in res) {
      failed++;
      continue;
    }
    await prisma.centerProfile.update({
      where: { id: c.id },
      data: {
        googleRating: res.rating,
        googleReviewCount: res.reviewCount,
        googleRatingAt: new Date(),
      },
    });
    updated++;
  }

  return NextResponse.json({ ok: true, total: centers.length, updated, failed });
}
