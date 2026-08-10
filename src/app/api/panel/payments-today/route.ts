import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Axiora admin paneli üçün bugünkü ödənişlər (Payriff, status=PAID).
 * amount qəpiklə saxlanır — cavab AZN-lə qaytarılır.
 * PANEL_SHARED_SECRET ilə qorunur.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.PANEL_SHARED_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Bakı = UTC+4 (DST yoxdur): lokal günün başlanğıcı UTC-də -4 saatdır.
  const bakuNow = new Date(Date.now() + 4 * 3600_000);
  const day = bakuNow.toISOString().slice(0, 10);
  const from = new Date(Date.parse(`${day}T00:00:00Z`) - 4 * 3600_000);
  const to = new Date(from.getTime() + 24 * 3600_000);

  const result = await prisma.payment.aggregate({
    where: { status: "PAID", paidAt: { gte: from, lt: to } },
    _sum: { amount: true },
    _count: true,
  });

  const total = Math.round(result._sum.amount ?? 0) / 100;
  return NextResponse.json({ total, count: result._count, currency: "AZN" });
}
