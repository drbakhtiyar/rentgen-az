import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { centerLimits } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * Read-only API for a center's appointment requests.
 * Auth: `Authorization: Bearer <apiKey>` or `?key=<apiKey>`. Platinum only.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const key = bearer || new URL(req.url).searchParams.get("key") || "";
  if (!key) {
    return NextResponse.json({ error: "API açarı tələb olunur." }, { status: 401 });
  }

  const center = await prisma.centerProfile.findUnique({
    where: { apiKey: key },
    select: { id: true, plan: true, name: true },
  });
  if (!center) {
    return NextResponse.json({ error: "Yanlış API açarı." }, { status: 401 });
  }
  if (!centerLimits(center.plan).apiExport) {
    return NextResponse.json({ error: "Paketiniz API girişini dəstəkləmir." }, { status: 403 });
  }

  const rows = await prisma.appointmentRequest.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      phone: true,
      serviceSlug: true,
      status: true,
      preferredDate: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ center: center.name, count: rows.length, data: rows });
}
