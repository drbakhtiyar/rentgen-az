"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { DAY_KEYS, DAY_LABELS_AZ, ymdToDayKey, type WeeklyHours } from "@/lib/hours";

const MONTHS_AZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * Calendar date picker where days the center is closed (and past days) are
 * disabled and cannot be selected. `hours` = center's weekly hours.
 */
export function DatePicker({
  value,
  onChange,
  hours,
  minYmd,
  placeholder = "Tarix seçin",
}: {
  value: string;
  onChange: (ymd: string) => void;
  hours: WeeklyHours;
  minYmd: string;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Which month is shown: the selected date's month, else the min month.
  const initial = (value || minYmd).split("-");
  const [view, setView] = React.useState({
    year: Number(initial[0]),
    month: Number(initial[1]) - 1,
  });

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay(); // 0=Sun
  const leading = (firstDow + 6) % 7; // Monday-first offset

  function isDisabled(dayYmd: string): boolean {
    if (dayYmd < minYmd) return true; // past
    return hours[ymdToDayKey(dayYmd)] === null; // center closed that weekday
  }

  function prevMonth() {
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }));
  }
  function nextMonth() {
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }));
  }

  const label = value
    ? (() => {
        const [y, m, d] = value.split("-").map(Number);
        return `${d} ${MONTHS_AZ[m - 1]} ${y}`;
      })()
    : placeholder;

  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={value ? "" : "text-slate-400"}>{label}</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-ink-900">
              {MONTHS_AZ[view.month]} {view.year}
            </span>
            <button type="button" onClick={nextMonth} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
            {DAY_KEYS.map((k) => (
              <span key={k}>{DAY_LABELS_AZ[k]}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} />;
              const cellYmd = ymd(view.year, view.month, d);
              const disabled = isDisabled(cellYmd);
              const selected = cellYmd === value;
              return (
                <button
                  key={cellYmd}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(cellYmd);
                    setOpen(false);
                  }}
                  className={
                    "flex h-9 items-center justify-center rounded-lg text-sm transition-colors " +
                    (selected
                      ? "bg-brand-600 font-semibold text-white"
                      : disabled
                        ? "cursor-not-allowed text-slate-300 line-through"
                        : "text-ink-800 hover:bg-brand-50")
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
