import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, Phone, Clock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { Panel, EmptyState, StatusBadge } from "@/components/dashboard/widgets";
import { RequestStatusControl } from "@/app/merkez/request-status-control";
import { getActiveServices } from "@/lib/queries";
import { getCenterDayAppointments, getFreeStartsForService } from "@/lib/crm";
import { bakuTodayYmd, DAY_LABELS_AZ, ymdToDayKey } from "@/lib/hours";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import { requireCenter } from "../_lib";
import { ManualAppointmentForm } from "../manual-appointment-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Təqvim", path: "/crm/teqvim", noIndex: true });

/** Shift a "YYYY-MM-DD" date by n days (timezone-safe). */
function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export default async function CrmCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { center } = await requireCenter("/crm/teqvim");
  const sp = await searchParams;
  const today = bakuTodayYmd();
  const ymd = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today;

  const [appts, freeStarts, services] = await Promise.all([
    getCenterDayAppointments(center.id, ymd),
    center.slotBookingEnabled
      ? getFreeStartsForService(center, center.id, ymd, center.slotMinutes)
      : Promise.resolve([]),
    getActiveServices(),
  ]);
  const svcName = new Map(services.map((s) => [s.slug, s.name]));
  const dayLabel = DAY_LABELS_AZ[ymdToDayKey(ymd)];

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink-900">Təqvim</h1>
        <ManualAppointmentForm
          services={services.map((s) => ({ slug: s.slug, name: s.name }))}
          defaultYmd={ymd}
        />
      </div>

      {/* Day navigation */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <Link
          href={`/crm/teqvim?d=${shiftYmd(ymd, -1)}`}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" /> Əvvəlki
        </Link>
        <div className="text-center">
          <div className="font-display text-lg font-bold text-ink-900">
            {ymd} <span className="text-slate-400">· {dayLabel}</span>
          </div>
          {ymd !== today && (
            <Link href="/crm/teqvim" className="text-xs font-semibold text-brand-600 hover:underline">
              Bu günə qayıt
            </Link>
          )}
        </div>
        <Link
          href={`/crm/teqvim?d=${shiftYmd(ymd, 1)}`}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Növbəti <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <Panel title="Cədvəl">
          {appts.length === 0 ? (
            <EmptyState icon={<CalendarDays />} title="Bu gün üçün randevu yoxdur" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {appts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="w-14 shrink-0 text-center">
                    <div className="font-display text-lg font-bold text-ink-900">{a.time || "—"}</div>
                    <div className="text-[11px] text-slate-400">{a.durationMin} dəq</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink-900">{a.name}</span>
                      {!a.patientId && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          sistemdə deyil
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                      <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1 hover:text-brand-600">
                        <Phone className="h-3 w-3" /> {formatPhoneDisplay(a.phone)}
                      </a>
                      {a.serviceSlug && <span>{svcName.get(a.serviceSlug) ?? a.serviceSlug}</span>}
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

        <Panel title="Boş vaxtlar">
          {!center.slotBookingEnabled ? (
            <p className="text-sm text-slate-500">
              Onlayn slot rezervasiyası söndürülüb. <Link href="/crm/ayarlar" className="font-semibold text-brand-600 hover:underline">Ayarlar</Link>-dan aktiv edin.
            </p>
          ) : freeStarts.length === 0 ? (
            <p className="text-sm text-slate-500">Bu gün üçün boş vaxt yoxdur.</p>
          ) : (
            <>
              <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" /> {center.slotMinutes} dəq addımla
              </p>
              <div className="flex flex-wrap gap-1.5">
                {freeStarts.map((t) => (
                  <span
                    key={t}
                    className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
