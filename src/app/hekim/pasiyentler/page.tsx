import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Users, Search, Download, Lock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { EmptyState, Panel, StatusBadge } from "@/components/dashboard/widgets";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { RequestPartnerButton } from "@/components/partnership/partnership-buttons";
import { RentgenDownloadList } from "@/components/rentgen/rentgen-download-list";
import { prisma } from "@/lib/db";
import { getActiveServices } from "@/lib/queries";
import { requireDoctor, doctorNavFor } from "../_lib";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
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

/** Two-letter initials from a patient name. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

/** Slug → readable label fallback when a service name isn't found. */
function prettifySlug(slug: string): string {
  const s = slug.replace(/-/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "—";
}

export default async function DoctorPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { doctor, isOwner } = await requireDoctor("/hekim/pasiyentler");

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
        where: { deletedAt: null },
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

  const services = await getActiveServices();
  const serviceName = new Map(services.map((s) => [s.slug, s.shortName ?? s.name]));

  // Referrals this doctor sent via the quick (public) referral form — matched
  // by the DOCTOR's phone (not the assistant's).
  const docUser = await prisma.user.findUnique({ where: { id: doctor.userId }, select: { phone: true } });
  const myReferrals = await prisma.referral.findMany({
    where: { doctorPhone: docUser?.phone ?? "" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { center: { select: { name: true, slug: true } } },
  });

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
  const pd = getPanelDict(await getLocale());
  const t = pd.doctor;

  return (
    <DashboardShell title={pd.nav.pasiyentler} roleLabel={pd.shell.roleDoctor} userName={fullName} nav={doctorNavFor(isOwner)}>
      <form className="mb-5 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder={pd.center.searchPlaceholder}
          className="max-w-xs"
        />
        <Button type="submit">
          <Search className="h-4 w-4" /> {pd.center.searchBtn}
        </Button>
      </form>

      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Users className="h-4 w-4" /> Pasiyentlərim
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{groups.length}</span>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((g) => (
            <div
              key={g.phone}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]"
            >
              {/* Patient header */}
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {initials(g.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{g.name}</p>
                  <p className="text-sm text-slate-500">{formatPhoneDisplay(g.phone)}</p>
                </div>
                <span className="ml-auto inline-flex shrink-0 items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                  {g.items.length} müraciət
                </span>
              </div>

              {/* Requests */}
              <div className="space-y-2.5 p-4">
                {g.items.map((r) => {
                  const partner = r.centerId ? partnerByCenter.get(r.centerId) ?? null : null;
                  const isPartner = partner === "ACCEPTED";
                  const svc = r.serviceSlug
                    ? serviceName.get(r.serviceSlug) ?? prettifySlug(r.serviceSlug)
                    : null;
                  return (
                    <div key={r.id} className="rounded-xl border border-slate-100 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                          {svc && (
                            <span className="inline-flex rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700 ring-1 ring-inset ring-cyan-100">
                              {svc}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={r.status} />
                          <span className="text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
                        </div>
                      </div>

                      {r.resultUrl && isPartner && (
                        <a
                          href={r.resultUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 hover:bg-brand-100"
                        >
                          <Download className="h-3.5 w-3.5" /> Rentgen nəticəsini aç
                        </a>
                      )}
                      {isPartner && <RentgenDownloadList files={r.files} />}
                      {r.resultUrl && !isPartner && r.centerId && (
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-100">
                          <span className="flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" />
                            Nəticəni görmək üçün bu mərkəzlə əməkdaşlıq sorğusu göndərin.
                          </span>
                          <RequestPartnerButton centerId={r.centerId} status={partner} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState
            icon={<Users />}
            title={query ? pd.center.noResultTitle : t.patientsEmptyTitle}
            description={query ? pd.center.noResultBody : t.patientsEmptyBody}
          />
        </Panel>
      )}

      {myReferrals.length > 0 && (
        <div className="mt-6">
          <Panel title={t.quickReferrals}>
            <ul className="divide-y divide-slate-100">
              {myReferrals.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-ink-900">{r.patientName}</span>
                    <span className="ml-2 text-slate-500">{r.examType}</span>
                    {r.center && (
                      <Link
                        href={`/rentgen-merkezleri/${r.center.slug}`}
                        className="ml-2 text-xs text-slate-400 hover:text-brand-600"
                      >
                        → {r.center.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </DashboardShell>
  );
}
