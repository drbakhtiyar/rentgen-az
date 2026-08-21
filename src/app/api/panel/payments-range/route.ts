import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Axiora maliyyə trendi: son N günün günlük PAID cəmi (qəpik). */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.PANEL_SHARED_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") ?? 30)));
  const from = new Date(Date.now() - days * 86400_000);
  const rows = await prisma.$queryRaw<{ d: Date; total: bigint }[]>`
    SELECT date_trunc('day', "paidAt" AT TIME ZONE 'Asia/Baku') d, sum(amount) total
    FROM "Payment" WHERE status = 'PAID' AND "paidAt" >= ${from}
    GROUP BY 1 ORDER BY 1`;
  return NextResponse.json({
    ok: true,
    currency: "AZN",
    days: rows.map((r) => ({ d: r.d.toISOString().slice(0, 10), total: Number(r.total) })),
  });
}
