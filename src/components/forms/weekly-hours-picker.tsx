"use client";

import * as React from "react";
import { Copy } from "lucide-react";
import {
  DAY_KEYS,
  type DayKey,
  type WeeklyHours,
  emptyWeek,
} from "@/lib/hours";

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Bazar ertəsi",
  tue: "Çərşənbə axşamı",
  wed: "Çərşənbə",
  thu: "Cümə axşamı",
  fri: "Cümə",
  sat: "Şənbə",
  sun: "Bazar",
};

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "18:00";

export function WeeklyHoursPicker({
  value,
  onChange,
}: {
  value: WeeklyHours | null;
  onChange: (next: WeeklyHours) => void;
}) {
  const week = value ?? emptyWeek();

  function setDay(day: DayKey, next: WeeklyHours[DayKey]) {
    onChange({ ...week, [day]: next });
  }

  function toggle(day: DayKey, open: boolean) {
    setDay(day, open ? { open: DEFAULT_OPEN, close: DEFAULT_CLOSE } : null);
  }

  function setTime(day: DayKey, field: "open" | "close", v: string) {
    const cur = week[day] ?? { open: DEFAULT_OPEN, close: DEFAULT_CLOSE };
    setDay(day, { ...cur, [field]: v });
  }

  // Copy the first open day's hours to every day.
  function applyToAll() {
    const first = DAY_KEYS.map((d) => week[d]).find(Boolean);
    if (!first) return;
    const next = emptyWeek();
    for (const d of DAY_KEYS) next[d] = { ...first };
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-800">İş saatları</p>
        <button
          type="button"
          onClick={applyToAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          <Copy className="h-3.5 w-3.5" /> Bütün günlərə tətbiq et
        </button>
      </div>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {DAY_KEYS.map((day) => {
          const d = week[day];
          const isOpen = !!d;
          return (
            <div
              key={day}
              className="flex flex-wrap items-center gap-3 px-3 py-2.5"
            >
              <label className="flex w-40 shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) => toggle(day, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <span className="text-sm font-medium text-ink-800">
                  {DAY_LABELS[day]}
                </span>
              </label>

              {isOpen ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={d.open}
                    onChange={(e) => setTime(day, "open", e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-ink-900 focus:border-brand-400 focus:outline-none"
                  />
                  <span className="text-slate-400">–</span>
                  <input
                    type="time"
                    value={d.close}
                    onChange={(e) => setTime(day, "close", e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-ink-900 focus:border-brand-400 focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm text-slate-400">Bağlı</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
