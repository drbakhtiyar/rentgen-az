import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { centerLimits } from "@/lib/plans";
import { doctorName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = String(v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

/** CSV export of the center's appointment requests (Platinum: apiExport). */
export async function GET() {
  const me = await getCurrentUser();
  if (me?.role !== "CENTER" || !me.centerProfile) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const center = await prisma.centerProfile.findUnique({
    where: { id: me.centerProfile.id },
    select: { id: true, plan: true },
  });
  if (!center || !centerLimits(center.plan).apiExport) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const rows = await prisma.appointmentRequest.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { doctor: { select: { firstName: true, lastName: true } } },
  });

  const header = ["Tarix", "Ad", "Telefon", "Xidmət", "Status", "Həkim", "Qeyd"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.createdAt.toISOString(),
        r.name,
        r.phone,
        r.serviceSlug ?? "",
        r.status,
        r.doctor ? doctorName(r.doctor.firstName, r.doctor.lastName) : "",
        r.note ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  const csv = "﻿" + lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="muracietler.csv"',
    },
  });
}
