import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { getActiveServices } from "@/lib/queries";
import {
  getCenterDayAppointments,
  getCenterWeekAppointments,
  shiftYmd,
  mondayOf,
  type DayAppointment,
} from "@/lib/crm";
import { bakuTodayYmd, DAY_LABELS_AZ, ymdToDayKey, parseHours, DAY_KEYS, nowInBaku } from "@/lib/hours";
import { buildMetadata } from "@/lib/seo";
import { requireCenter } from "../_lib";
import { CrmUpsell } from "../crm-upsell";
import { ManualAppointmentForm } from "../manual-appointment-form";
import { CalendarGrid, type GridDay, type GridAppt } from "../calendar-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Təqvim", path: "/crm/teqvim", noIndex: true });

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function toGridAppt(a: DayAppointment, svcName: Map<string, string>): GridAppt | null {
  if (!a.time) return null; // no scheduled time → not placeable on the grid
  return {
    id: a.id,
    startMin: toMin(a.time),
    durationMin: a.durationMin,
    name: a.name,
    serviceName: a.serviceSlug ? svcName.get(a.serviceSlug) ?? a.serviceSlug : null,
    status: a.status,
    patientId: a.patientId,
  };
}

/** Visible hour range: center working hours across the week, widened to fit appts. */
function hourRange(hoursJson: unknown, appts: GridAppt[]): { startHour: number; endHour: number } {
  const week = parseHours(hoursJson);
  let minOpen = 24 * 60;
  let maxClose = 0;
  if (week) {
    for (const k of DAY_KEYS) {
      const d = week[k];
      if (d) {
        minOpen = Math.min(minOpen, toMin(d.open));
        maxClose = Math.max(maxClose, toMin(d.close));
      }
    }
  }
  for (const a of appts) {
    minOpen = Math.min(minOpen, a.startMin);
    maxClose = Math.max(maxClose, a.startMin + a.durationMin);
  }
  let startHour = minOpen < 24 * 60 ? Math.floor(minOpen / 60) : 8;
  let endHour = maxClose > 0 ? Math.ceil(maxClose / 60) : 20;
  startHour = Math.max(0, Math.min(startHour, 12));
  endHour = Math.min(24, Math.max(endHour, startHour + 4));
  return { startHour, endHour };
}

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

  // Build the grid days.
  let gridDays: GridDay[];
  if (view === "week") {
    const monday = mondayOf(ymd);
    const week = await getCenterWeekAppointments(center.id, monday);
    gridDays = week.map((d) => ({
      ymd: d.ymd,
      weekday: DAY_LABELS_AZ[ymdToDayKey(d.ymd)],
      dayNum: d.ymd.slice(8),
      isToday: d.ymd === today,
      appts: d.appts.map((a) => toGridAppt(a, svcName)).filter((x): x is GridAppt => x != null),
    }));
  } else {
    const appts = await getCenterDayAppointments(center.id, ymd);
    gridDays = [
      {
        ymd,
        weekday: DAY_LABELS_AZ[ymdToDayKey(ymd)],
        dayNum: ymd.slice(8),
        isToday: ymd === today,
        appts: appts.map((a) => toGridAppt(a, svcName)).filter((x): x is GridAppt => x != null),
      },
    ];
  }

  const allAppts = gridDays.flatMap((d) => d.appts);
  const { startHour, endHour } = hourRange(center.hours, allAppts);
  const nowMin = nowInBaku().minutes;

  // Navigation
  const step = view === "week" ? 7 : 1;
  const navBase = view === "week" ? mondayOf(ymd) : ymd;
  const prev = shiftYmd(navBase, -step);
  const next = shiftYmd(navBase, step);
  const dateLabel =
    view === "week" ? `${mondayOf(ymd)} — ${shiftYmd(mondayOf(ymd), 6)}` : `${ymd} · ${DAY_LABELS_AZ[ymdToDayKey(ymd)]}`;

  const btn = "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100";

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-ink-900">Təqvim</h1>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <Link
              href={`/crm/teqvim?view=day&d=${ymd}`}
              className={`rounded-md px-3 py-1 text-sm font-semibold ${view === "day" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Gün
            </Link>
            <Link
              href={`/crm/teqvim?view=week&d=${ymd}`}
              className={`rounded-md px-3 py-1 text-sm font-semibold ${view === "week" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Həftə
            </Link>
          </div>
        </div>
        <ManualAppointmentForm services={serviceOptions} defaultYmd={ymd} />
      </div>

      {/* Date navigation */}
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/crm/teqvim?view=${view}&d=${prev}`} className={btn} aria-label="Əvvəlki">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link href={`/crm/teqvim?view=${view}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Bu gün
        </Link>
        <Link href={`/crm/teqvim?view=${view}&d=${next}`} className={btn} aria-label="Növbəti">
          <ChevronRight className="h-4 w-4" />
        </Link>
        <span className="ml-2 font-display text-sm font-bold text-ink-900">{dateLabel}</span>
      </div>

      <CalendarGrid days={gridDays} startHour={startHour} endHour={endHour} nowMin={nowMin} />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Yeni</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-teal-400" /> Təsdiqli</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Tamamlanıb</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-500" /> Ləğv</span>
      </div>
    </DashboardShell>
  );
}
