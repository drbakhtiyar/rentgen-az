import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, Phone, Clock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { Panel, EmptyState, StatusBadge } from "@/components/dashboard/widgets";
import { RequestStatusControl } from "@/app/merkez/request-status-control";
import { getActiveServices } from "@/lib/queries";
import {
  getCenterDayAppointments,
  getCenterWeekAppointments,
  getFreeStartsForService,
  shiftYmd,
  mondayOf,
} from "@/lib/crm";
import { bakuTodayYmd, DAY_LABELS_AZ, ymdToDayKey } from "@/lib/hours";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import { requireCenter } from "../_lib";
import { CrmUpsell } from "../crm-upsell";
import { ManualAppointmentForm } from "../manual-appointment-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Təqvim", path: "/crm/teqvim", noIndex: true });

export default async function CrmCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; view?: string }>;
}) {
  const { center } = await requireCenter("/crm/teqvim");
  if (center.plan !== "PLATINUM") return <CrmUpsell centerName={center.name} />;
  const sp = await searchParams;
  const today = bakuTodayYmd();
  const ymd = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today;
  const view = sp.view === "week" ? "week" : "day";

  const services = await getActiveServices();
  const svcName = new Map(services.map((s) => [s.slug, s.name]));
  const serviceOptions = services.map((s) => ({ slug: s.slug, name: s.name }));

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink-900">Təqvim</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
            <Link
              href={`/crm/teqvim?view=day&d=${ymd}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${view === "day" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Gün
            </Link>
            <Link
              href={`/crm/teqvim?view=week&d=${ymd}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${view === "week" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Həftə
            </Link>
          </div>
          <ManualAppointmentForm services={serviceOptions} defaultYmd={ymd} />
        </div>
      </div>

      {view === "week" ? (
        <WeekView centerId={center.id} ymd={ymd} today={today} svcName={svcName} />
      ) : (
        <DayView
          center={center}
          ymd={ymd}
          today={today}
          svcName={svcName}
        />
      )}
    </DashboardShell>
  );
}

/* ----------------------------- Day view ----------------------------- */

async function DayView({
  center,
  ymd,
  today,
  svcName,
}: {
  center: { id: string; slotBookingEnabled: boolean; slotMinutes: number; hours: unknown; slotCapacity: number };
  ymd: string;
  today: string;
  svcName: Map<string, string>;
}) {
  const [appts, freeStarts] = await Promise.all([
    getCenterDayAppointments(center.id, ymd),
    center.slotBookingEnabled
      ? getFreeStartsForService(center, center.id, ymd, center.slotMinutes)
      : Promise.resolve([]),
  ]);
  const dayLabel = DAY_LABELS_AZ[ymdToDayKey(ymd)];

  return (
    <>
      <DayNav ymd={ymd} today={today} label={dayLabel} step={1} viewParam="day" />
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
    </>
  );
}

/* ----------------------------- Week view ---------------------------- */

async function WeekView({
  centerId,
  ymd,
  today,
  svcName,
}: {
  centerId: string;
  ymd: string;
  today: string;
  svcName: Map<string, string>;
}) {
  const monday = mondayOf(ymd);
  const days = await getCenterWeekAppointments(centerId, monday);
  const sunday = shiftYmd(monday, 6);

  return (
    <>
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <Link
          href={`/crm/teqvim?view=week&d=${shiftYmd(monday, -7)}`}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" /> Əvvəlki
        </Link>
        <div className="text-center">
          <div className="font-display text-base font-bold text-ink-900">
            {monday} — {sunday}
          </div>
          {(today < monday || today > sunday) && (
            <Link href="/crm/teqvim?view=week" className="text-xs font-semibold text-brand-600 hover:underline">
              Bu həftəyə qayıt
            </Link>
          )}
        </div>
        <Link
          href={`/crm/teqvim?view=week&d=${shiftYmd(monday, 7)}`}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Növbəti <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[900px] grid-cols-7 gap-2">
          {days.map((day) => {
            const isToday = day.ymd === today;
            const dayNum = day.ymd.slice(8);
            return (
              <div
                key={day.ymd}
                className={`rounded-xl border ${isToday ? "border-brand-300 bg-brand-50/40" : "border-slate-200 bg-white"}`}
              >
                <Link
                  href={`/crm/teqvim?view=day&d=${day.ymd}`}
                  className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2 hover:bg-slate-50"
                >
                  <span className="text-xs font-bold text-ink-900">
                    {DAY_LABELS_AZ[ymdToDayKey(day.ymd)]}
                  </span>
                  <span className={`text-xs font-semibold ${isToday ? "text-brand-600" : "text-slate-400"}`}>
                    {dayNum}
                  </span>
                </Link>
                <div className="space-y-1.5 p-2">
                  {day.appts.length === 0 ? (
                    <p className="py-3 text-center text-[11px] text-slate-300">—</p>
                  ) : (
                    day.appts.map((a) => (
                      <div
                        key={a.id}
                        className={`rounded-lg px-2 py-1.5 text-xs ring-1 ring-inset ${STATUS_TILE[a.status] ?? "bg-slate-50 text-slate-700 ring-slate-100"}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold">{a.time}</span>
                          <span className="text-[10px] opacity-70">{a.durationMin}′</span>
                        </div>
                        <div className="truncate font-medium">{a.name}</div>
                        {a.serviceSlug && (
                          <div className="truncate text-[10px] opacity-75">
                            {svcName.get(a.serviceSlug) ?? a.serviceSlug}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const STATUS_TILE: Record<string, string> = {
  NEW: "bg-brand-50 text-brand-800 ring-brand-100",
  CONTACTED: "bg-cyan-50 text-cyan-800 ring-cyan-100",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  CANCELLED: "bg-red-50 text-red-700 ring-red-100 line-through",
};

/* Day/prev-next navigation bar (day view). */
function DayNav({
  ymd,
  today,
  label,
  step,
  viewParam,
}: {
  ymd: string;
  today: string;
  label: string;
  step: number;
  viewParam: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <Link
        href={`/crm/teqvim?view=${viewParam}&d=${shiftYmd(ymd, -step)}`}
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
      >
        <ChevronLeft className="h-4 w-4" /> Əvvəlki
      </Link>
      <div className="text-center">
        <div className="font-display text-lg font-bold text-ink-900">
          {ymd} <span className="text-slate-400">· {label}</span>
        </div>
        {ymd !== today && (
          <Link href={`/crm/teqvim?view=${viewParam}`} className="text-xs font-semibold text-brand-600 hover:underline">
            Bu günə qayıt
          </Link>
        )}
      </div>
      <Link
        href={`/crm/teqvim?view=${viewParam}&d=${shiftYmd(ymd, step)}`}
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
      >
        Növbəti <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
