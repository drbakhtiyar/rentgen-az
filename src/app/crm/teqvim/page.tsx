import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import {
  getCenterDayAppointments,
  getCenterWeekAppointments,
  getCenterTimeBlocks,
  getCenterWeekTimeBlocks,
  getCenterMonthCounts,
  shiftYmd,
  mondayOf,
  type DayAppointment,
  type CrmTimeBlock,
} from "@/lib/crm";
import { getActiveServices } from "@/lib/queries";
import { bakuTodayYmd, DAY_LABELS_AZ, DAY_KEYS, ymdToDayKey, parseHours, nowInBaku } from "@/lib/hours";
import { buildMetadata } from "@/lib/seo";
import { requireCenter } from "../_lib";
import { CrmUpsell } from "../crm-upsell";
import { CalendarClient, CalendarActions, type GridDay, type GridAppt, type GridBlock } from "../calendar-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Təqvim", path: "/crm/teqvim", noIndex: true });

const AZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function firstOfMonth(ymd: string): string {
  return `${ymd.slice(0, 8)}01`;
}
function addMonths(ymd: string, n: number): string {
  const [y, m] = ymd.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

function toGridAppt(a: DayAppointment, ymd: string, svcName: Map<string, string>): GridAppt | null {
  if (!a.time) return null;
  return {
    id: a.id,
    ymd,
    startMin: toMin(a.time),
    durationMin: a.durationMin,
    name: a.name,
    phone: a.phone,
    serviceSlug: a.serviceSlug,
    serviceName: a.serviceSlug ? svcName.get(a.serviceSlug) ?? a.serviceSlug : null,
    note: a.note,
    status: a.status,
    patientId: a.patientId,
  };
}
function toGridBlocks(blocks: CrmTimeBlock[], ymd: string): GridBlock[] {
  return blocks.map((b) => ({ id: b.id, ymd, startMin: b.startMin, endMin: b.endMin, reason: b.reason, fixed: b.fixed }));
}

function hourRange(hoursJson: unknown, appts: GridAppt[], blocks: GridBlock[]) {
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
  for (const b of blocks) {
    minOpen = Math.min(minOpen, b.startMin);
    maxClose = Math.max(maxClose, b.endMin);
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
  const view = sp.view === "day" ? "day" : sp.view === "month" ? "month" : "week"; // default: week

  const services = await getActiveServices();
  const svcName = new Map(services.map((s) => [s.slug, s.name]));
  const serviceOptions = services.map((s) => ({ slug: s.slug, name: s.name }));

  const toggle = (v: string, label: string) => (
    <Link
      href={`/crm/teqvim?view=${v}&d=${ymd}`}
      className={`rounded-md px-3 py-1 text-sm font-semibold ${view === v ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
    >
      {label}
    </Link>
  );
  const btn = "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100";

  // ---- Month view ----
  if (view === "month") {
    const gridStart = mondayOf(firstOfMonth(ymd));
    const cells = Array.from({ length: 42 }, (_, i) => shiftYmd(gridStart, i));
    const counts = await getCenterMonthCounts(center.id, cells[0], cells[41]);
    const curMonth = ymd.slice(0, 7);
    const monthName = `${AZ_MONTHS[Number(ymd.slice(5, 7)) - 1]} ${ymd.slice(0, 4)}`;

    return (
      <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink-900">Təqvim</h1>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              {toggle("day", "Gün")}
              {toggle("week", "Həftə")}
              {toggle("month", "Ay")}
            </div>
          </div>
          <CalendarActions services={serviceOptions} defaultYmd={ymd} />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Link href={`/crm/teqvim?view=month&d=${addMonths(ymd, -1)}`} className={btn}><ChevronLeft className="h-4 w-4" /></Link>
          <Link href="/crm/teqvim?view=month" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Bu ay</Link>
          <Link href={`/crm/teqvim?view=month&d=${addMonths(ymd, 1)}`} className={btn}><ChevronRight className="h-4 w-4" /></Link>
          <span className="ml-2 font-display text-sm font-bold text-ink-900">{monthName}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold text-slate-500">
            {DAY_KEYS.map((k) => (
              <div key={k} className="py-2">{DAY_LABELS_AZ[k]}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((c) => {
              const inMonth = c.slice(0, 7) === curMonth;
              const isToday = c === today;
              const count = counts[c] ?? 0;
              return (
                <Link
                  key={c}
                  href={`/crm/teqvim?view=day&d=${c}`}
                  className={`min-h-[92px] border-b border-l border-slate-100 p-2 transition-colors hover:bg-brand-50/40 ${inMonth ? "" : "bg-slate-50/60"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white" : inMonth ? "text-ink-900" : "text-slate-400"}`}>
                      {Number(c.slice(8))}
                    </span>
                  </div>
                  {count > 0 && (
                    <span className="mt-2 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      {count} randevu
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ---- Day / Week views ----
  let gridDays: GridDay[];
  if (view === "week") {
    const monday = mondayOf(ymd);
    const [week, weekBlocks] = await Promise.all([
      getCenterWeekAppointments(center.id, monday),
      getCenterWeekTimeBlocks(center.id, monday),
    ]);
    gridDays = week.map((d) => ({
      ymd: d.ymd,
      weekday: DAY_LABELS_AZ[ymdToDayKey(d.ymd)],
      dayNum: d.ymd.slice(8),
      isToday: d.ymd === today,
      appts: d.appts.map((a) => toGridAppt(a, d.ymd, svcName)).filter((x): x is GridAppt => x != null),
      blocks: toGridBlocks(weekBlocks[d.ymd] ?? [], d.ymd),
    }));
  } else {
    const [appts, blocks] = await Promise.all([
      getCenterDayAppointments(center.id, ymd),
      getCenterTimeBlocks(center.id, ymd),
    ]);
    gridDays = [
      {
        ymd,
        weekday: DAY_LABELS_AZ[ymdToDayKey(ymd)],
        dayNum: ymd.slice(8),
        isToday: ymd === today,
        appts: appts.map((a) => toGridAppt(a, ymd, svcName)).filter((x): x is GridAppt => x != null),
        blocks: toGridBlocks(blocks, ymd),
      },
    ];
  }

  const allAppts = gridDays.flatMap((d) => d.appts);
  const allBlocks = gridDays.flatMap((d) => d.blocks);
  const { startHour, endHour } = hourRange(center.hours, allAppts, allBlocks);
  const nowMin = nowInBaku().minutes;

  const step = view === "week" ? 7 : 1;
  const navBase = view === "week" ? mondayOf(ymd) : ymd;
  const dateLabel =
    view === "week" ? `${mondayOf(ymd)} — ${shiftYmd(mondayOf(ymd), 6)}` : `${ymd} · ${DAY_LABELS_AZ[ymdToDayKey(ymd)]}`;
  const inWeek = today >= mondayOf(ymd) && today <= shiftYmd(mondayOf(ymd), 6);
  const actionsYmd = view === "week" ? (inWeek ? today : mondayOf(ymd)) : ymd;

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-ink-900">Təqvim</h1>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {toggle("day", "Gün")}
            {toggle("week", "Həftə")}
            {toggle("month", "Ay")}
          </div>
        </div>
        <CalendarActions services={serviceOptions} defaultYmd={actionsYmd} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Link href={`/crm/teqvim?view=${view}&d=${shiftYmd(navBase, -step)}`} className={btn} aria-label="Əvvəlki">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link href={`/crm/teqvim?view=${view}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Bu gün
        </Link>
        <Link href={`/crm/teqvim?view=${view}&d=${shiftYmd(navBase, step)}`} className={btn} aria-label="Növbəti">
          <ChevronRight className="h-4 w-4" />
        </Link>
        <span className="ml-2 font-display text-sm font-bold text-ink-900">{dateLabel}</span>
      </div>

      <CalendarClient
        days={gridDays}
        startHour={startHour}
        endHour={endHour}
        nowMin={nowMin}
        slotMinutes={center.slotMinutes}
        services={serviceOptions}
      />

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Yeni</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" /> Təsdiqli</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Tamamlanıb</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Ləğv</span>
      </div>
    </DashboardShell>
  );
}
