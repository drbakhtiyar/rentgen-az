import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Axiora «Diqqət» tabı: rentgen.az-da cavab/qərar gözləyən işlər.
 * PANEL_SHARED_SECRET Bearer ilə qorunur (stats-today ilə eyni naxış).
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.PANEL_SHARED_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [pendingCenters, newRequests, unansweredThreads, pendingDoctors] = await Promise.all([
    prisma.centerProfile.count({ where: { status: "PENDING", name: { not: "" } } }),
    prisma.appointmentRequest.count({ where: { status: "NEW" } }),
    // Cavabsız söhbət: son user mesajından sonra admin oxumayıb
    prisma.adminThread.count({
      where: {
        OR: [{ adminReadAt: null }, { adminReadAt: { lt: prisma.adminThread.fields.lastMessageAt } }],
      },
    }),
    prisma.doctorProfile.count({ where: { status: "PENDING" } }),
  ]).catch(async () => {
    // fields müqayisəsi köhnə Prisma-da yoxdursa — sadə variant
    const [a, b, d] = await Promise.all([
      prisma.centerProfile.count({ where: { status: "PENDING", name: { not: "" } } }),
      prisma.appointmentRequest.count({ where: { status: "NEW" } }),
      prisma.doctorProfile.count({ where: { status: "PENDING" } }),
    ]);
    const rows = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT count(*) c FROM "AdminThread" t
      WHERE t."adminReadAt" IS NULL OR t."adminReadAt" < t."lastMessageAt"`;
    return [a, b, Number(rows[0]?.c ?? 0), d] as const;
  });

  const items = [
    { key: "pending-centers", label: "Təsdiq gözləyən mərkəz", count: pendingCenters, url: "https://rentgen.az/admin/merkezler?status=PENDING" },
    { key: "new-requests", label: "Yeni müraciət (NEW)", count: newRequests, url: "https://rentgen.az/admin/muracietler" },
    { key: "unanswered-chats", label: "Oxunmamış söhbət", count: unansweredThreads, url: "https://rentgen.az/admin/sohbetler" },
    { key: "pending-doctors", label: "Təsdiq gözləyən həkim", count: pendingDoctors, url: "https://rentgen.az/admin/hekimler" },
  ].filter((i) => i.count > 0);

  return NextResponse.json({ ok: true, items });
}
