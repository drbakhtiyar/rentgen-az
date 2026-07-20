import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Inbox,
  ListChecks,
  Clock,
  AlertCircle,
  ArrowRight,
  Users,
  Stethoscope,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { StatCard, EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { viewerEnabled } from "@/lib/viewer-access";
import { getCenterEventStats, getCenterStorageUsage, getCenterFullStats } from "@/lib/queries";
import { StorageUsage } from "@/components/dashboard/storage-usage";
import { CenterAnalytics } from "@/components/dashboard/center-analytics";
import { SupportCard } from "@/components/dashboard/support-card";
import { PlanExpiryBanner } from "@/components/dashboard/plan-expiry-banner";
import { centerLimits, effectiveExtraTb } from "@/lib/plans";
import { getFileDownloadLabels } from "@/lib/rentgen-status";
import { formatDateAz, formatDateTimeAz, doctorName } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";
import { RequestStatusControl } from "./request-status-control";
import { RequestResultForm } from "./request-result-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəz kabineti",
  path: "/merkez",
  noIndex: true,
});

function daysUntil(d: Date | null): number | null {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default async function CenterDashboardPage() {
  const user = await requireRole("CENTER", "/merkez");
  const canView = await viewerEnabled();
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    include: { _count: { select: { services: true, appointmentRequests: true } } },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const requests = await prisma.appointmentRequest.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      doctor: { select: { firstName: true, lastName: true } },
      files: {
        select: { id: true, fileName: true, size: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  const downloadLabels = await getFileDownloadLabels(
    requests.flatMap((r) => r.files.map((f) => f.id)),
  );
  const newCount = await prisma.appointmentRequest.count({
    where: { centerId: center.id, status: "NEW" },
  });
  const stats = await getCenterEventStats(center.id, 30);
  const storageUsed = await getCenterStorageUsage(center.id);
  const fullStats = centerLimits(center.plan).fullAnalytics
    ? await getCenterFullStats(center.id, 30)
    : null;

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

  const name =
    center.name ||
    [user.patientProfile?.firstName, user.patientProfile?.lastName].filter(Boolean).join(" ") ||
    "Mərkəz";

  const planDaysLeft = daysUntil(center.planUntil);
  const pd = getPanelDict(await getLocale());
  const c = pd.center;

  return (
    <DashboardShell title={pd.nav.icmal} roleLabel={c.roleLabel} userName={name} nav={centerNav}>
      {center.plan !== "FREE" && (
        <PlanExpiryBanner
          daysLeft={planDaysLeft}
          planUntil={center.planUntil ? formatDateAz(center.planUntil) : null}
          href="/merkez/paket"
        />
      )}
      {!center.licenseUrl && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">{c.noLicenseTitle}</p>
              <p className="text-sm text-red-800">{c.noLicenseBody}</p>
            </div>
          </div>
          <ButtonLink href="/merkez/profil" size="sm" className="shrink-0">
            {c.uploadLicense}
          </ButtonLink>
        </div>
      )}

      {center.status !== "APPROVED" && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">
              {center.status === "PENDING" ? c.pendingTitle : c.deactivatedTitle}
            </p>
            <p className="text-sm text-amber-800">
              {center.status === "PENDING" ? c.pendingBody : c.deactivatedBody}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={c.statStatus} value={<StatusBadge status={center.status} />} icon={<Building2 />} />
        <StatCard label={c.statNew} value={newCount} icon={<Inbox />} tone="amber" />
        <StatCard label={c.statTotal} value={center._count.appointmentRequests} icon={<Inbox />} tone="cyan" />
        <StatCard label={c.statServices} value={center._count.services} icon={<ListChecks />} tone="green" />
      </div>

      <CenterAnalytics plan={center.plan} stats={stats} full={fullStats} />

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]">
        <StorageUsage
          usedBytes={storageUsed}
          plan={center.plan}
          extraGb={effectiveExtraTb(center.extraStorageTb, center.extraStorageUntil) * 1024}
        />
      </div>

      {centerLimits(center.plan).prioritySupport && (
        <div className="mt-5">
          <SupportCard chatHref="/merkez/chat" />
        </div>
      )}

      {center._count.services === 0 && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-brand-600" />
            <p className="text-sm text-brand-900">{c.noServicesBanner}</p>
          </div>
          <ButtonLink href="/merkez/xidmetler" size="sm" className="shrink-0">
            {c.add}
          </ButtonLink>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title={c.recentRequests}
            action={
              <Link
                href="/merkez/pasiyentler"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                <Users className="h-4 w-4" /> {c.allPatients}
              </Link>
            }
          >
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-100 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">{r.name}</p>
                        <p className="text-sm text-slate-500">
                          <a href={`tel:${r.phone}`} className="hover:text-brand-600">
                            {r.phone}
                          </a>
                          {r.serviceSlug ? ` · ${r.serviceSlug}` : ""}
                        </p>
                        {r.preferredDate && (
                          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                            <Clock className="h-3 w-3" /> {formatDateTimeAz(r.preferredDate)}
                          </p>
                        )}
                        {r.doctor && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Stethoscope className="h-3.5 w-3.5 text-slate-400" /> {c.referringDoctor}{" "}
                            <span className="font-medium text-ink-700">
                              {doctorName(r.doctor.firstName, r.doctor.lastName)}
                            </span>
                          </p>
                        )}
                        {r.note && <p className="mt-1 text-sm text-slate-600">{r.note}</p>}
                        <p className="mt-1 text-xs text-slate-400">{formatDateAz(r.createdAt)}</p>
                      </div>
                      <RequestStatusControl id={r.id} status={r.status} patientUpdated={r.patientUpdated} />
                    </div>
                    {r.status === "COMPLETED" && (
                      <RequestResultForm
                        requestId={r.id}
                        defaultUrl={r.resultUrl}
                        doctorId={r.doctorId}
                        doctors={doctorOptions}
                        canView={canView}
                        files={r.files.map((f) => ({
                          ...f,
                          downloadNote: downloadLabels[f.id],
                        }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Inbox />}
                title={c.noRequestsTitle}
                description={c.noRequestsBody}
              />
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title={c.quickLinks}>
            <div className="space-y-2">
              <QuickLink href="/merkez/profil" label={c.editProfile} icon={<Building2 />} />
              <QuickLink href="/merkez/xidmetler" label={c.servicesPrices} icon={<ListChecks />} />
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-sm font-medium text-ink-800 hover:border-brand-200 hover:bg-brand-50"
    >
      <span className="flex items-center gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-brand-600">
        {icon} {label}
      </span>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
