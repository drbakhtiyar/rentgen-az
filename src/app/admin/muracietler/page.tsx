import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Building2, Stethoscope, ScanLine, Clock } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, formatDateTimeAz, doctorName } from "@/lib/utils";
import { formatPhoneDisplay, phoneToInternational } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import { CenterSuggestFilter } from "@/components/admin/center-suggest-filter";
import type { Prisma } from "@/generated/prisma/client";
import type { RequestStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Müraciətlər",
  path: "/admin/muracietler",
  noIndex: true,
});

const PER_PAGE = 30;

const SORTS = {
  date_desc: { createdAt: "desc" },
  date_asc: { createdAt: "asc" },
  name_asc: { name: "asc" },
  name_desc: { name: "desc" },
} as const;
type SortKey = keyof typeof SORTS;

const STATUSES: RequestStatus[] = ["NEW", "CONTACTED", "COMPLETED", "CANCELLED"];
const STATUS_LABEL: Record<RequestStatus, string> = {
  NEW: "Yeni",
  CONTACTED: "Əlaqə saxlanılıb",
  COMPLETED: "Tamamlanıb",
  CANCELLED: "Ləğv edilib",
};

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; status?: string; center?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/muracietler");
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const center = sp.center?.trim() || undefined;
  const status = STATUSES.includes(sp.status as RequestStatus) ? (sp.status as RequestStatus) : undefined;
  const sort: SortKey = (sp.sort as SortKey) in SORTS ? (sp.sort as SortKey) : "date_desc";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  // Base filters (search + center) — shared by the list and the status counts.
  const baseWhere: Prisma.AppointmentRequestWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    ...(center ? { center: { name: { contains: center, mode: "insensitive" } } } : {}),
  };
  const where: Prisma.AppointmentRequestWhereInput = { ...baseWhere, ...(status ? { status } : {}) };

  const [requests, filteredTotal, statusGroups, services, centerRows] = await Promise.all([
    prisma.appointmentRequest
      .findMany({
        where,
        include: {
          center: { select: { name: true, slug: true } },
          doctor: { select: { firstName: true, lastName: true } },
        },
        orderBy: SORTS[sort],
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      })
      .catch(() => []),
    prisma.appointmentRequest.count({ where }).catch(() => 0),
    // Per-status counts respecting the search/center filter (not the status chip).
    prisma.appointmentRequest.groupBy({ by: ["status"], where: baseWhere, _count: true }).catch(() => []),
    prisma.service.findMany({ select: { slug: true, name: true } }).catch(() => []),
    prisma.centerProfile
      .findMany({ where: { appointmentRequests: { some: {} } }, select: { name: true }, orderBy: { name: "asc" } })
      .catch(() => []),
  ]);

  const serviceNames = new Map(services.map((s) => [s.slug, s.name]));
  const centerNames = centerRows.map((c) => c.name);
  const countByStatus = new Map(statusGroups.map((g) => [g.status, g._count]));
  const totalAll = statusGroups.reduce((n, g) => n + g._count, 0);
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PER_PAGE));

  const buildQs = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, center, status, sort: sort !== "date_desc" ? sort : undefined, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, String(v));
    const qs = params.toString();
    return `/admin/muracietler${qs ? `?${qs}` : ""}`;
  };
  const pageUrl = (p: number) => buildQs({ page: p > 1 ? String(p) : undefined });
  const statusUrl = (s?: RequestStatus) => buildQs({ status: s, page: undefined });

  return (
    <AdminShell title="Müraciətlər" userName={admin.phone}>
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
        <form action="/admin/muracietler" className="flex flex-wrap items-center gap-2">
          {/* keep the active status/center when submitting the text search */}
          {status && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={q ?? ""} placeholder="Ad və ya telefon üzrə axtar" className="max-w-xs" />
          <div className="w-full sm:w-64">
            <CenterSuggestFilter
              names={centerNames}
              defaultValue={center ?? ""}
              basePath="/admin/muracietler"
              paramName="center"
              placeholder="Mərkəz üzrə süz…"
              preserve={{ q: q ?? "", status: status ?? "", sort: sort !== "date_desc" ? sort : "" }}
            />
          </div>
          <select name="sort" defaultValue={sort} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="date_desc">Tarix: yeni əvvəl</option>
            <option value="date_asc">Tarix: köhnə əvvəl</option>
            <option value="name_asc">Ad: A → Z</option>
            <option value="name_desc">Ad: Z → A</option>
          </select>
          <Button type="submit">Axtar</Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusChip href={statusUrl(undefined)} active={!status} label="Hamısı" count={totalAll} />
          {STATUSES.map((s) => (
            <StatusChip
              key={s}
              href={statusUrl(s)}
              active={status === s}
              label={STATUS_LABEL[s]}
              count={countByStatus.get(s) ?? 0}
            />
          ))}
          {(q || center || status) && (
            <Link href="/admin/muracietler" className="ml-1 text-sm font-medium text-slate-400 underline hover:text-slate-600">
              Filtri təmizlə
            </Link>
          )}
        </div>
      </div>

      <Panel title={`Pasiyent müraciətləri — ${filteredTotal}${status ? ` · ${STATUS_LABEL[status]}` : ""}`}>
        {requests.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {requests.map((r) => {
              const serviceName = r.serviceSlug ? serviceNames.get(r.serviceSlug) ?? r.serviceSlug : null;
              const refDoctor = r.doctor ? doctorName(r.doctor.firstName, r.doctor.lastName) : null;
              return (
                <div key={r.id} className="flex flex-col rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">{r.name}</p>
                      <a
                        href={`tel:+${phoneToInternational(r.phone)}`}
                        className="text-sm text-slate-500 hover:text-brand-600"
                      >
                        {formatPhoneDisplay(r.phone)}
                      </a>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={r.status} />
                      {r.patientId ? (
                        <Badge tone="green">Qeydiyyatlı</Badge>
                      ) : (
                        <Badge tone="slate">Qonaq</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                    <CompactRow icon={<Building2 />} label="Mərkəz">
                      {r.center?.slug ? (
                        <Link href={`/rentgen-merkezleri/${r.center.slug}`} className="font-medium text-ink-800 hover:text-brand-600">
                          {r.center.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </CompactRow>
                    <CompactRow icon={<ScanLine />} label="Xidmət">
                      {serviceName ?? <span className="text-slate-400">—</span>}
                    </CompactRow>
                    {refDoctor && (
                      <CompactRow icon={<Stethoscope />} label="Həkim">
                        {refDoctor}
                      </CompactRow>
                    )}
                    {r.preferredDate && (
                      <CompactRow icon={<Clock />} label="Vaxt">
                        {formatDateTimeAz(r.preferredDate)}
                      </CompactRow>
                    )}
                  </div>

                  {r.note && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">{r.note}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">{formatDateAz(r.createdAt)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={<Inbox />} title="Müraciət tapılmadı" description="Seçilmiş filtrə uyğun müraciət yoxdur." />
        )}

        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">
              Səhifə {page} / {pageCount} · {filteredTotal} müraciət
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <a href={pageUrl(page - 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                  ← Əvvəlki
                </a>
              ) : (
                <span className="cursor-not-allowed rounded-lg bg-slate-50 px-3 py-1.5 text-slate-300">← Əvvəlki</span>
              )}
              {page < pageCount ? (
                <a href={pageUrl(page + 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                  Növbəti →
                </a>
              ) : (
                <span className="cursor-not-allowed rounded-lg bg-slate-50 px-3 py-1.5 text-slate-300">Növbəti →</span>
              )}
            </div>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}

function StatusChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors ${
        active ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-[11px] font-bold ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function CompactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-slate-400 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      <span className="shrink-0 text-xs text-slate-400">{label}:</span>
      <span className="min-w-0 truncate text-ink-800">{children}</span>
    </div>
  );
}
