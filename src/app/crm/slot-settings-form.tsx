"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { updateSlotSettingsAction } from "./actions";
import { useLocale } from "@/components/locale-context";
import { getCrmDict } from "@/lib/i18n-crm";

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "B.e" },
  { key: "tue", label: "Ç.a" },
  { key: "wed", label: "Ç" },
  { key: "thu", label: "C.a" },
  { key: "fri", label: "Cümə" },
  { key: "sat", label: "Şənbə" },
  { key: "sun", label: "Bazar" },
];

/** Center CRM slot settings: online booking, grid step, capacity, lunch break. */
export function SlotSettingsForm({
  enabled,
  slotMinutes,
  slotCapacity,
  lunchStart,
  lunchEnd,
  lunchDays,
  openDays,
  remindersEnabled,
  reminderHours,
}: {
  enabled: boolean;
  slotMinutes: number;
  slotCapacity: number;
  lunchStart: string | null;
  lunchEnd: string | null;
  lunchDays: string[];
  openDays: string[]; // only working weekdays are offered for lunch
  remindersEnabled: boolean;
  reminderHours: number;
}) {
  const router = useRouter();
  const t = getCrmDict(useLocale());
  const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const dayLabel = (key: string) => t.slotForm.days[DAY_KEYS.indexOf(key as (typeof DAY_KEYS)[number])] ?? key;
  const shownDays = DAYS.filter((d) => openDays.includes(d.key));
  const [on, setOn] = React.useState(enabled);
  const [step, setStep] = React.useState(slotMinutes);
  const [cap, setCap] = React.useState(slotCapacity);
  const [lunchOn, setLunchOn] = React.useState(!!(lunchStart && lunchEnd && lunchDays.length));
  const [lStart, setLStart] = React.useState(lunchStart ?? "13:00");
  const [lEnd, setLEnd] = React.useState(lunchEnd ?? "14:00");
  const [lDays, setLDays] = React.useState<string[]>(
    lunchDays.length ? lunchDays.filter((d) => openDays.includes(d)) : openDays,
  );
  const [remOn, setRemOn] = React.useState(remindersEnabled);
  const [remHours, setRemHours] = React.useState(reminderHours);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggleDay(k: string) {
    setLDays((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await updateSlotSettingsAction({
      enabled: on,
      slotMinutes: step,
      slotCapacity: cap,
      lunchEnabled: lunchOn,
      lunchStart: lStart,
      lunchEnd: lEnd,
      lunchDays: lDays,
      remindersEnabled: remOn,
      reminderHours: remHours,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSaved(true);
    router.refresh();
  }

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none";

  return (
    <div className="space-y-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="font-semibold text-ink-900">{t.slotForm.toggleTitle}</span>
          <span className="block text-sm text-slate-500">{t.slotForm.toggleDesc}</span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            {t.slotForm.stepLabel}
          </label>
          <input
            type="number"
            min={5}
            max={240}
            step={5}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className={field}
          />
          <p className="mt-1 text-xs text-slate-400">
            {t.slotForm.stepHint}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            {t.slotForm.capLabel}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={cap}
            onChange={(e) => setCap(Number(e.target.value))}
            className={field}
          />
          <p className="mt-1 text-xs text-slate-400">
            {t.slotForm.capHint}
          </p>
        </div>
      </div>

      {/* Recurring lunch break */}
      <div className="rounded-xl border border-slate-200 p-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={lunchOn} onChange={(e) => setLunchOn(e.target.checked)} className="mt-1" />
          <span>
            <span className="font-semibold text-ink-900">{t.slotForm.lunchTitle}</span>
            <span className="block text-sm text-slate-500">{t.slotForm.lunchDesc}</span>
          </span>
        </label>

        {lunchOn && (
          <div className="mt-4 space-y-3 pl-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">{t.slotForm.start}</label>
                <input type="time" value={lStart} onChange={(e) => setLStart(e.target.value)} className={field} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">{t.slotForm.end}</label>
                <input type="time" value={lEnd} onChange={(e) => setLEnd(e.target.value)} className={field} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">{t.slotForm.daysLabel}</label>
              <div className="flex flex-wrap gap-1.5">
                {shownDays.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset transition-colors ${
                      lDays.includes(d.key)
                        ? "bg-brand-600 text-white ring-brand-600"
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {dayLabel(d.key)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appointment reminders */}
      <div className="rounded-xl border border-slate-200 p-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={remOn} onChange={(e) => setRemOn(e.target.checked)} className="mt-1" />
          <span>
            <span className="font-semibold text-ink-900">{t.slotForm.remTitle}</span>
            <span className="block text-sm text-slate-500">{t.slotForm.remDesc}</span>
          </span>
        </label>
        {remOn && (
          <div className="mt-4 pl-7">
            <label className="mb-1 block text-xs font-semibold text-slate-500">{t.slotForm.hoursBefore}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={168}
                value={remHours}
                onChange={(e) => setRemHours(Number(e.target.value))}
                className={`${field} w-28`}
              />
              <span className="text-sm text-slate-500">{t.slotForm.hoursWord}</span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t.common.save}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">{t.slotForm.saved}</span>}
      </div>
    </div>
  );
}
