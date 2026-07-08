import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Users, Search, Download, Lock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import { EmptyState, Panel, StatusBadge } from "@/components/dashboard/widgets";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { RequestPartnerButton } from "@/components/partnership/partnership-buttons";
import { RentgenDownloadList } from "@/components/rentgen/rentgen-download-list";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, doctorName } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import type { Prisma } from "@/generated/prisma/client";
import type { PartnerStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pasiyentlər",
  path: "/hekim/pasiyentler",
  noIndex: true,
});

export default async function DoctorPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole("DOCTOR", "/hekim/pasiyentler");
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!doctor) redirect("/hekim/qeydiyyat");

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where: Prisma.AppointmentRequestWhereInput = { doctorId: doctor.id };
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
    ];
  }

  const requests = await prisma.appointmentRequest.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      serviceSlug: true,
      status: true,
      createdAt: true,
      centerId: true,
      resultUrl: true,
      center: { select: { name: true, slug: true } },
      files: {
        select: { id: true, fileName: true, size: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const partners = await prisma.centerDoctor.findMany({
    where: { doctorId: doctor.id },
    select: { centerId: true, status: true },
  });
  const partnerByCenter = new Map<string, PartnerStatus>(
    partners.map((p) => [p.centerId, p.status]),
  );

  // Group by patient phone.
  const groups: { phone: string; name: string; items: typeof requests }[] = [];
  const index = new Map<string, number>();
  for (const r of requests) {
    let i = index.get(r.phone);
    if (i === undefined) {
      i = groups.length;
      index.set(r.phone, i);
      groups.push({ phone: r.phone, name: r.name, items: [] });
    }
    groups[i].items.push(r);
  }

  const fullName =
    doctorName(doctor.firstName, doctor.lastName);

  return (
    <DashboardShell title="Pasiyentlər" roleLabel="Həkim" userName={fullName} nav={doctorNav}>
      <form className="mb-5 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Ad və ya telefon üzrə axtar"
          className="max-w-xs"
        />
        <Button type="submit">
          <Search className="h-4 w-4" /> Axtar
        </Button>
      </form>

      <Panel title={`Pasiyentlərim (${groups.length})`}>
        {groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.phone} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">{g.name}</span>
                  <span className="text-sm text-slate-500">{formatPhoneDisplay(g.phone)}</span>
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                    {g.items.length} müraciət
                  </span>
                </div>
                <ul className="mt-3 divide-y divide-slate-100">
                  {g.items.map((r) => {
                    const partner = r.centerId ? partnerByCenter.get(r.centerId) ?? null : null;
                    const isPartner = partner === "ACCEPTED";
                    return (
                      <li key={r.id} className="py-2.5 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            {r.center ? (
                              <Link
                                href={`/rentgen-merkezleri/${r.center.slug}`}
                                className="font-medium text-ink-900 hover:text-brand-600"
                              >
                                {r.center.name}
                              </Link>
                            ) : (
                              <span className="font-medium text-slate-500">—</span>
                            )}
                            <span className="ml-2 text-slate-500">{r.serviceSlug || "—"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={r.status} />
                            <span className="text-xs text-slate-400">
                              {formatDateAz(r.createdAt)}
                            </span>
                          </div>
                        </div>

                        {r.resultUrl && isPartner && (
                          <a
                            href={r.resultUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 hover:bg-brand-100"
                          >
                            <Download className="h-3.5 w-3.5" /> Rentgen nəticəsini aç
                          </a>
                        )}
                        {isPartner && <RentgenDownloadList files={r.files} />}
                        {r.resultUrl && !isPartner && r.centerId && (
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-100">
                            <span className="flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5" />
                              Nəticəni görmək üçün bu mərkəzlə əməkdaşlıq sorğusu göndərin.
                            </span>
                            <RequestPartnerButton centerId={r.centerId} status={partner} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users />}
            title={query ? "Nəticə tapılmadı" : "Hələ pasiyent yoxdur"}
            description={
              query
                ? "Axtarışa uyğun pasiyent yoxdur."
                : "Pasiyentlər müraciət edərkən sizi seçəndə burada görünəcək."
            }
          />
        )}
      </Panel>
    </DashboardShell>
  );
}
