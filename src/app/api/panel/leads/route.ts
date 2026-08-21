import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Axiora «Lead-lər» tabı: son N günün müraciətləri (ad+nömrə+mənbə). */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.PANEL_SHARED_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const days = Math.min(30, Math.max(1, Number(url.searchParams.get("days") ?? 7)));
  const from = new Date(Date.now() - days * 86400_000);
  const rows = await prisma.appointmentRequest.findMany({
    where: { createdAt: { gte: from } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      name: true,
      phone: true,
      status: true,
      createdAt: true,
      center: { select: { name: true } },
      serviceSlug: true,
    },
  });
  return NextResponse.json({
    ok: true,
    leads: rows.map((r) => ({
      name: r.name,
      phone: r.phone,
      status: r.status,
      at: r.createdAt.toISOString(),
      note: [r.center?.name, r.serviceSlug].filter(Boolean).join(" · "),
    })),
  });
}
