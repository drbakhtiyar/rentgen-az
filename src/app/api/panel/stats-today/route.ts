import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Axiora admin paneli üçün bugünkü hərəkət: randevu sorğuları, yeni
 * qeydiyyatlar, yüklənən rentgen faylları. PANEL_SHARED_SECRET ilə qorunur.
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
  const createdAt = { gte: from, lt: to };

  const [requests, users, files] = await Promise.all([
    prisma.appointmentRequest.count({ where: { createdAt } }),
    prisma.user.count({ where: { createdAt } }),
    prisma.rentgenFile.count({ where: { createdAt, deletedAt: null } }),
  ]);

  return NextResponse.json({
    items: [
      { label: "randevu sorğusu", count: requests },
      { label: "yeni qeydiyyat", count: users },
      { label: "yüklənən fayl", count: files },
    ],
  });
}
