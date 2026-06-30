import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOM = "﻿";

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

  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" },
    include: { patientProfile: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Ad",
    "Soyad",
    "Telefon",
    "Şəhər",
    "Bloklanıb",
    "Qeydiyyat tarixi",
  ];

  const rows = patients.map((u) =>
    csvRow([
      u.patientProfile?.firstName ?? "",
      u.patientProfile?.lastName ?? "",
      u.phone,
      u.patientProfile?.city ?? "",
      u.isBlocked ? "Bəli" : "Xeyr",
      formatDateAz(u.createdAt),
    ]),
  );

  const csv = [csvRow(header), ...rows].join("\r\n");

  return new Response(BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pasiyentler.csv"',
    },
  });
}
