import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Send, Users, Building2, AlertTriangle, Download, Lock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import {
  StatCard,
  Panel,
  EmptyState,
  StatusBadge,
} from "@/components/dashboard/widgets";
import { RequestPartnerButton } from "@/components/partnership/partnership-buttons";
import { RentgenDownloadList } from "@/components/rentgen/rentgen-download-list";
import { DoctorStats } from "@/components/dashboard/doctor-stats";
import { SupportCard } from "@/components/dashboard/support-card";
import { PlanExpiryBanner } from "@/components/dashboard/plan-expiry-banner";
import { getDoctorStats } from "@/lib/queries";
import { doctorLimits } from "@/lib/plans";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, doctorName } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "İcmal",
  path: "/hekim",
  noIndex: true,
});

type Referral = {
  id: string;
  name: string;
  phone: string;
  serviceSlug: string | null;
  status: string;
  createdAt: Date;
  centerId: string | null;
  resultUrl: string | null;
  center: { name: string; slug: string } | null;
  files: { id: string; fileName: string; size: number }[];
};

type PartnerStatus = "PENDING" | "ACCEPTED" | "REJECTED";

function daysUntil(d: Date | null): number | null {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default async function DoctorDashboardPage() {
  const user = await requireRole("DOCTOR", "/hekim");

  let doctor = null;
  try {
    doctor = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
    });
  } catch {
    doctor = null;
  }
  if (!doctor) redirect("/hekim/qeydiyyat");

  const fullName =
    doctorName(doctor.firstName, doctor.lastName);
  const doctorStats = await getDoctorStats(doctor.id, 30);

  let requests: Referral[] = [];
  const partnerByCenter = new Map<string, PartnerStatus>();
  try {
    requests = await prisma.appointmentRequest.findMany({
      where: { doctorId: doctor.id },
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
      take: 200,
    });
    const partners = await prisma.centerDoctor.findMany({
      where: { doctorId: doctor.id },
      select: { centerId: true, status: true },
    });
    for (const p of partners) partnerByCenter.set(p.centerId, p.status);
  } catch {
    requests = [];
  }

  const uniquePatients = new Set(requests.map((r) => r.phone)).size;
  const uniqueCenters = new Set(
    requests.map((r) => r.centerId).filter(Boolean),
  ).size;

  // Group referrals by patient phone, preserving createdAt-desc order.
  const groups: { phone: string; name: string; items: Referral[] }[] = [];
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
  const t = pd.doctor;

  return (
    <DashboardShell
      title={pd.nav.icmal}
      roleLabel={pd.shell.roleDoctor}
      userName={fullName}
      nav={doctorNav}
    >
      {doctor.plan !== "FREE" && (
        <PlanExpiryBanner
          daysLeft={daysUntil(doctor.planUntil)}
          planUntil={doctor.planUntil ? formatDateAz(doctor.planUntil) : null}
          href="/hekim/paket"
        />
      )}
      {doctor.status !== "APPROVED" && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">
              {doctor.status === "DEACTIVATED" ? t.deactivatedTitle : t.pendingTitle}
            </p>
            <p className="mt-0.5">{t.pendingBody}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.statReferrals}
          value={requests.length}
          icon={<Send />}
          tone="brand"
        />
        <StatCard
          label={t.statPatients}
          value={uniquePatients}
          icon={<Users />}
          tone="cyan"
        />
        <StatCard
          label={t.statCenters}
          value={uniqueCenters}
          icon={<Building2 />}
          tone="green"
        />
      </div>

      <div className="mt-5">
        <DoctorStats plan={doctor.plan} stats={doctorStats} />
      </div>

      {doctorLimits(doctor.plan).prioritySupport && (
        <div className="mt-5">
          <SupportCard chatHref="/hekim/chat" />
        </div>
      )}

      <div className="mt-5">
        <Panel
          title={t.myPatients}
          action={
            <Link
              href="/hekim/pasiyentler"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <Users className="h-4 w-4" /> {t.all}
            </Link>
          }
        >
          {groups.length > 0 ? (
            <div className="space-y-4">
              {groups.map((g) => (
                <div
                  key={g.phone}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-900">{g.name}</span>
                    <span className="text-sm text-slate-500">
                      {formatPhoneDisplay(g.phone)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                      {g.items.length} {t.requestsWord}
                    </span>
                  </div>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {g.items.map((r) => {
                      const partner = r.centerId
                        ? partnerByCenter.get(r.centerId) ?? null
                        : null;
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
                              <span className="ml-2 text-slate-500">
                                {r.serviceSlug || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={r.status} />
                              <span className="text-xs text-slate-400">
                                {formatDateAz(r.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Result link — gated by partnership */}
                          {r.resultUrl && isPartner && (
                            <a
                              href={r.resultUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 hover:bg-brand-100"
                            >
                              <Download className="h-3.5 w-3.5" /> {t.openResult}
                            </a>
                          )}
                          {isPartner && <RentgenDownloadList files={r.files} />}
                          {r.resultUrl && !isPartner && r.centerId && (
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-100">
                              <span className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" />
                                {t.lockedResult}
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
              title={t.refEmptyTitle}
              description={t.refEmptyBody}
            />
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
