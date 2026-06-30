import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import type { CenterStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOM = "﻿";

const STATUS_LABELS: Record<CenterStatus, string> = {
  PENDING: "Gözləmədə",
  APPROVED: "Təsdiqlənmiş",
  DEACTIVATED: "Deaktiv",
};

function csvField(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (/[;"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(values: unknown[]): string {
  return values.map(csvField).join(";");
}

export async function GET() {
  await requireRole("ADMIN");

  const centers = await prisma.centerProfile.findMany({
    include: { _count: { select: { services: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Ad",
    "Status",
    "Şəhər",
    "Telefon",
    "WhatsApp",
    "Ünvan",
    "İş saatları",
    "Xidmət sayı",
    "Qeydiyyat tarixi",
  ];

  const rows = centers.map((c) =>
    csvRow([
      c.name,
      STATUS_LABELS[c.status] ?? c.status,
      c.city ?? "",
      c.phone,
      c.whatsapp ?? "",
      c.address ?? "",
      c.workingHours ?? "",
      c._count.services,
      formatDateAz(c.createdAt),
    ]),
  );

  const csv = [csvRow(header), ...rows].join("\r\n");

  return new Response(BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="merkezler.csv"',
    },
  });
}
