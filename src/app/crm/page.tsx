import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, Users, Inbox, Phone, AlertCircle, Stethoscope } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { StatCard, Panel, EmptyState, StatusBadge } from "@/components/dashboard/widgets";
import { RequestStatusControl } from "@/app/merkez/request-status-control";
import { getActiveServices } from "@/lib/queries";
import { getCrmOverview, getCenterDayAppointments } from "@/lib/crm";
import { bakuTodayYmd } from "@/lib/hours";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getCrmDict } from "@/lib/i18n-crm";
import { requireCenter } from "./_lib";
import { CrmUpsell } from "./crm-upsell";
import { ManualAppointmentForm } from "./manual-appointment-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Bugün", path: "/crm", noIndex: true });

export default async function CrmTodayPage() {
  const { center } = await requireCenter("/crm");
  if (center.plan !== "PLATINUM") return <CrmUpsell centerName={center.name} />;
  const t = getCrmDict(await getLocale());
  const today = bakuTodayYmd();
  const [overview, appts, services] = await Promise.all([
    getCrmOverview(center.id, today),
    getCenterDayAppointments(center.id, today),
    getActiveServices(),
  ]);
  const svcName = new Map(services.map((s) => [s.slug, s.name]));

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav} collapsible>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{t.today.title}</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <ManualAppointmentForm
          services={services.map((s) => ({ slug: s.slug, name: s.name }))}
          defaultYmd={today}
        />
      </div>

      {center.smsBalance <= 500 && (
        <Link
          href="/crm/sms"
          className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {center.smsBalance === 0
              ? t.today.smsOut
              : `${t.today.smsLowPre}${center.smsBalance}${t.today.smsLowPost}`}{" "}
            <span className="font-semibold underline">{t.today.smsBuyLink}</span>
          </span>
        </Link>
      )}

      {!center.slotBookingEnabled && (
        <Link
          href="/crm/ayarlar"
          className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {t.today.slotOffPre}
            <span className="font-semibold underline">{t.today.slotOffLink}</span>
            {t.today.slotOffPost}
          </span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.today.statToday} value={overview.todayCount} icon={<CalendarDays />} />
        <StatCard label={t.today.statUpcoming} value={overview.upcomingCount} icon={<Clock />} tone="cyan" />
        <StatCard label={t.today.statNew} value={overview.newCount} icon={<Inbox />} tone="amber" />
        <StatCard label={t.today.statPatients} value={overview.totalPatients} icon={<Users />} tone="slate" />
      </div>

      <div className="mt-6">
        <Panel title={t.today.scheduleTitle}>
          {appts.length === 0 ? (
            <EmptyState
              icon={<CalendarDays />}
              title={t.today.emptyTitle}
              description={t.today.emptyDesc}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {appts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="w-14 shrink-0 text-center">
                    <div className="font-display text-lg font-bold text-ink-900">{a.time || "—"}</div>
                    <div className="text-[11px] text-slate-400">{a.durationMin} {t.common.min}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink-900">{a.name}</span>
                      {!a.patientId && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          {t.common.notInSystem}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                      <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1 hover:text-brand-600">
                        <Phone className="h-3 w-3" /> {formatPhoneDisplay(a.phone)}
                      </a>
                      {a.serviceSlug && <span>{svcName.get(a.serviceSlug) ?? a.serviceSlug}</span>}
                      {a.doctorName && (
                        <span className="inline-flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" /> Dr. {a.doctorName}
                          {a.doctorPhone && (
                            <a href={`tel:${a.doctorPhone}`} className="text-brand-600 hover:underline">
                              {formatPhoneDisplay(a.doctorPhone)}
                            </a>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <RequestStatusControl id={a.id} status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
