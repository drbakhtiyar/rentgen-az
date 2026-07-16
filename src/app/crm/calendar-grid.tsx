"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export type GridAppt = {
  id: string;
  startMin: number; // minutes from midnight (Baku)
  durationMin: number;
  name: string;
  serviceName: string | null;
  status: string;
  patientId: string | null;
};

export type GridDay = {
  ymd: string;
  weekday: string; // "B.e"
  dayNum: string; // "13"
  isToday: boolean;
  appts: GridAppt[];
};

const PX_PER_HOUR = 56;

// Left accent + subtle fill per status (dark theme).
const STATUS: Record<string, { bar: string; fill: string; dot: string }> = {
  NEW: { bar: "bg-sky-400", fill: "bg-sky-500/10", dot: "bg-sky-400" },
  CONTACTED: { bar: "bg-teal-400", fill: "bg-teal-500/10", dot: "bg-emerald-400" },
  COMPLETED: { bar: "bg-emerald-400", fill: "bg-emerald-500/10", dot: "bg-emerald-400" },
  CANCELLED: { bar: "bg-slate-500", fill: "bg-slate-500/10", dot: "bg-slate-500" },
};

/** Assign overlapping appointments to side-by-side lanes within a day. */
function packLanes(appts: GridAppt[]) {
  const sorted = [...appts].sort((a, b) => a.startMin - b.startMin);
  const laneEnds: number[] = [];
  const placed = sorted.map((a) => {
    const end = a.startMin + Math.max(a.durationMin, 15);
    let lane = laneEnds.findIndex((e) => e <= a.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    return { appt: a, lane };
  });
  return { placed, laneCount: Math.max(1, laneEnds.length) };
}

function DayColumn({
  day,
  startHour,
  endHour,
  nowMin,
}: {
  day: GridDay;
  startHour: number;
  endHour: number;
  nowMin: number | null;
}) {
  const router = useRouter();
  const total = (endHour - startHour) * 60;
  const { placed, laneCount } = packLanes(day.appts);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  return (
    <div className="relative border-l border-slate-800" style={{ height: total * (PX_PER_HOUR / 60) }}>
      {/* hour gridlines */}
      {hours.map((h) => (
        <div
          key={h}
          className="border-b border-slate-800/70"
          style={{ height: PX_PER_HOUR }}
        />
      ))}

      {/* now line */}
      {nowMin != null && nowMin >= startHour * 60 && nowMin <= endHour * 60 && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
          style={{ top: (nowMin - startHour * 60) * (PX_PER_HOUR / 60) }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <span className="h-px flex-1 bg-rose-500/60" />
        </div>
      )}

      {/* appointments */}
      <div className="absolute inset-0">
        {placed.map(({ appt, lane }) => {
          const top = (appt.startMin - startHour * 60) * (PX_PER_HOUR / 60);
          const height = Math.max(appt.durationMin, 22) * (PX_PER_HOUR / 60);
          const w = 100 / laneCount;
          const s = STATUS[appt.status] ?? STATUS.NEW;
          const clickable = !!appt.patientId;
          const hh = String(Math.floor(appt.startMin / 60)).padStart(2, "0");
          const mm = String(appt.startMin % 60).padStart(2, "0");
          return (
            <div
              key={appt.id}
              onClick={clickable ? () => router.push(`/crm/pasiyentler/${appt.patientId}`) : undefined}
              className={`absolute overflow-hidden rounded-md border border-slate-700/60 ${s.fill} px-2 py-1 text-left ${clickable ? "cursor-pointer hover:border-slate-500" : ""}`}
              style={{ top, height, left: `calc(${lane * w}% + 4px)`, width: `calc(${w}% - 8px)` }}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} />
              <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${s.dot}`} />
              <div className="pl-1.5">
                <div className="text-[11px] font-medium text-slate-400">
                  {hh}:{mm}
                </div>
                <div className="truncate text-[13px] font-semibold text-slate-100">{appt.name}</div>
                {appt.serviceName && height > 44 && (
                  <div className="truncate text-[11px] text-slate-400">{appt.serviceName}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Dark time-grid calendar (day = 1 column, week = 7 columns). */
export function CalendarGrid({
  days,
  startHour,
  endHour,
  nowMin,
}: {
  days: GridDay[];
  startHour: number;
  endHour: number;
  nowMin: number | null;
}) {
  const total = (endHour - startHour) * 60;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-200">
      <div className="overflow-x-auto">
        <div style={{ minWidth: days.length > 1 ? 900 : 420 }}>
          {/* Header row */}
          <div className="flex border-b border-slate-800">
            <div className="w-14 shrink-0" />
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
              {days.map((d) => (
                <div
                  key={d.ymd}
                  className="border-l border-slate-800 px-2 py-2.5 text-center"
                >
                  <span className={`text-sm font-semibold ${d.isToday ? "text-teal-400" : "text-slate-300"}`}>
                    {d.weekday} {d.dayNum}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex">
            {/* time gutter */}
            <div className="w-14 shrink-0" style={{ height: total * (PX_PER_HOUR / 60) }}>
              {hours.map((h) => (
                <div key={h} className="relative" style={{ height: PX_PER_HOUR }}>
                  <span className="absolute -top-2 right-2 text-[11px] text-slate-500">
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
            {/* day columns */}
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
              {days.map((d) => (
                <DayColumn key={d.ymd} day={d} startHour={startHour} endHour={endHour} nowMin={d.isToday ? nowMin : null} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
