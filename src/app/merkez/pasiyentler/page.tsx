import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users, Search, Clock, Stethoscope } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getActiveServices } from "@/lib/queries";
import { trashRetentionDays } from "@/lib/plans";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, formatDateTimeAz, doctorName } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import { RequestStatusControl } from "../request-status-control";
import { RequestResultForm } from "../request-result-form";
import { getFileDownloadLabels } from "@/lib/rentgen-status";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pasiyentlər",
  path: "/merkez/pasiyentler",
  noIndex: true,
});

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

function prettifySlug(slug: string): string {
  const s = slug.replace(/-/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "Ümumi müraciət";
}

export default async function CenterPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole("CENTER", "/merkez/pasiyentler");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, plan: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");
  const trashDays = trashRetentionDays(center.plan);

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where: Prisma.AppointmentRequestWhereInput = { centerId: center.id };
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
    ];
  }

  const requests = await prisma.appointmentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      doctor: { select: { firstName: true, lastName: true } },
      files: {
        where: { deletedAt: null },
        select: { id: true, fileName: true, size: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  const downloadLabels = await getFileDownloadLabels(
    requests.flatMap((r) => r.files.map((f) => f.id)),
  );

  const services = await getActiveServices();
  const serviceName = new Map(services.map((s) => [s.slug, s.shortName ?? s.name]));

  // Approved doctors for manual referring-doctor assignment.
  const doctorOptions = (
    await prisma.doctorProfile.findMany({
      where: { status: "APPROVED" },
      select: { id: true, firstName: true, lastName: true, clinic: true },
      orderBy: { firstName: "asc" },
    })
  ).map((d) => ({
    value: d.id,
    label:
      doctorName(d.firstName, d.lastName) +
      (d.clinic ? ` — ${d.clinic}` : ""),
  }));

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

  const pd = getPanelDict(await getLocale());
  const c = pd.center;

  return (
    <DashboardShell title={pd.nav.pasiyentler} roleLabel={c.roleLabel} userName={center.name} nav={centerNav}>
      <form className="mb-5 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder={c.searchPlaceholder}
          className="max-w-xs"
        />
        <Button type="submit">
          <Search className="h-4 w-4" /> {c.searchBtn}
        </Button>
      </form>

      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Users className="h-4 w-4" /> Pasiyentlər
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
                  <a href={`tel:${g.phone}`} className="text-sm text-slate-500 hover:text-brand-600">
                    {formatPhoneDisplay(g.phone)}
                  </a>
                </div>
                <span className="ml-auto inline-flex shrink-0 items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                  {g.items.length} müraciət
                </span>
              </div>

              {/* Requests */}
              <div className="space-y-3 p-4">
                {g.items.map((r) => {
                  const refDoctor = r.doctor
                    ? doctorName(r.doctor.firstName, r.doctor.lastName)
                    : null;
                  const svc = r.serviceSlug
                    ? serviceName.get(r.serviceSlug) ?? prettifySlug(r.serviceSlug)
                    : c.generalRequest;
                  return (
                    <div key={r.id} className="rounded-xl border border-slate-100 p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-100">
                              {svc}
                            </span>
                            {r.preferredDate && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                                <Clock className="h-3 w-3" /> {formatDateTimeAz(r.preferredDate)}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
                          </div>
                          {refDoctor && (
                            <span className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                              <Stethoscope className="h-3.5 w-3.5" /> {c.sentBy} {refDoctor}
                            </span>
                          )}
                          {r.note && <p className="mt-1.5 text-sm text-slate-600">{r.note}</p>}
                        </div>
                        <RequestStatusControl id={r.id} status={r.status} patientUpdated={r.patientUpdated} />
                      </div>
                      {r.status === "COMPLETED" && (
                        <RequestResultForm
                          requestId={r.id}
                          defaultUrl={r.resultUrl}
                          doctorId={r.doctorId}
                          doctors={doctorOptions}
                          trashDays={trashDays}
                          files={r.files.map((f) => ({
                            ...f,
                            downloadNote: downloadLabels[f.id],
                          }))}
                        />
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
            title={query ? c.noResultTitle : c.patientsEmptyTitle}
            description={query ? c.noResultBody : c.patientsEmptyBody}
          />
        </Panel>
      )}
    </DashboardShell>
  );
}
