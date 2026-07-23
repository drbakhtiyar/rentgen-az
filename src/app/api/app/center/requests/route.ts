import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAppKey, nationalDigits } from "@/lib/app-api";
import { getAppCenterForPhone } from "@/lib/app-catalog";
import { doctorName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function sizeLabel(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/**
 * GET /api/app/center/requests?phone= — a center's incoming appointment
 * requests (all statuses), for the center app. App-key protected, no-store.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const gate = requireAppKey(req);
  if (gate) return gate;

  const phone = new URL(req.url).searchParams.get("phone") ?? "";
  if (nationalDigits(phone).length < 7) {
    return NextResponse.json({ ok: false, error: "phone tələb olunur" }, { status: 400 });
  }
  try {
    const center = await getAppCenterForPhone(phone);
    if (!center) return NextResponse.json({ ok: true, center: null, requests: [] }, { headers: { "Cache-Control": "no-store" } });

    const rows = await prisma.appointmentRequest.findMany({
      where: { centerId: center.id },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: {
        id: true, name: true, phone: true, serviceSlug: true, note: true,
        preferredDate: true, status: true, createdAt: true, patientId: true,
        doctor: { select: { firstName: true, lastName: true } },
        files: { where: { deletedAt: null }, select: { id: true, fileName: true, size: true } },
      },
    });

    const slugs = [...new Set(rows.map((r) => r.serviceSlug).filter((s): s is string => Boolean(s)))];
    const svc = slugs.length
      ? await prisma.service.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } })
      : [];
    const svcName = new Map(svc.map((s) => [s.slug, s.name]));

    const requests = rows.map((r) => ({
      id: r.id,
      patientName: r.name,
      patientPhone: r.phone,
      registered: Boolean(r.patientId),
      referringDoctor: r.doctor ? doctorName(r.doctor.firstName, r.doctor.lastName) : null,
      serviceSlug: r.serviceSlug,
      serviceName: r.serviceSlug ? svcName.get(r.serviceSlug) ?? null : null,
      status: r.status,
      note: r.note,
      preferredDate: r.preferredDate ? r.preferredDate.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      files: r.files.map((f) => ({ id: f.id, name: f.fileName, sizeLabel: sizeLabel(f.size), url: null })),
    }));

    return NextResponse.json(
      { ok: true, center: { id: center.id, name: center.name, slug: center.slug }, requests },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[api/app/center/requests]", e);
    return NextResponse.json({ ok: false, error: "oxuna bilmədi" }, { status: 502 });
  }
}
