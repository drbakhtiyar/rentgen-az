"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { updateSlotSettingsAction } from "./actions";

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
}: {
  enabled: boolean;
  slotMinutes: number;
  slotCapacity: number;
  lunchStart: string | null;
  lunchEnd: string | null;
  lunchDays: string[];
}) {
  const router = useRouter();
  const [on, setOn] = React.useState(enabled);
  const [step, setStep] = React.useState(slotMinutes);
  const [cap, setCap] = React.useState(slotCapacity);
  const [lunchOn, setLunchOn] = React.useState(!!(lunchStart && lunchEnd && lunchDays.length));
  const [lStart, setLStart] = React.useState(lunchStart ?? "13:00");
  const [lEnd, setLEnd] = React.useState(lunchEnd ?? "14:00");
  const [lDays, setLDays] = React.useState<string[]>(
    lunchDays.length ? lunchDays : ["mon", "tue", "wed", "thu", "fri"],
  );
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
          <span className="font-semibold text-ink-900">Onlayn slot rezervasiyası</span>
          <span className="block text-sm text-slate-500">
            Aktiv olanda pasiyentlər saytda mərkəzinizin real boş vaxtlarını görüb birbaşa
            yazılır. Söndürülsə, köhnə sərbəst vaxt rejimi işləyir.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Slot addımı (dəqiqə)
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
            Cədvəldə vaxtların hansı addımla göstərildiyi (məs. 30 dəq).
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Eyni vaxtda tutum (kabinet/aparat sayı)
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
            Bir vaxtda neçə pasiyent qəbul edə bilərsiniz.
          </p>
        </div>
      </div>

      {/* Recurring lunch break */}
      <div className="rounded-xl border border-slate-200 p-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={lunchOn} onChange={(e) => setLunchOn(e.target.checked)} className="mt-1" />
          <span>
            <span className="font-semibold text-ink-900">Nahar fasiləsi</span>
            <span className="block text-sm text-slate-500">
              Fiks nahar vaxtı. Doldurularsa seçilmiş günlərdə bu aralıq avtomatik bloklanır —
              hər gün ayrıca blok yaratmağa ehtiyac qalmır.
            </span>
          </span>
        </label>

        {lunchOn && (
          <div className="mt-4 space-y-3 pl-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Başlanğıc</label>
                <input type="time" value={lStart} onChange={(e) => setLStart(e.target.value)} className={field} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Bitmə</label>
                <input type="time" value={lEnd} onChange={(e) => setLEnd(e.target.value)} className={field} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Günlər</label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => (
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
                    {d.label}
                  </button>
                ))}
              </div>
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
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Yadda saxla
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saxlanıldı</span>}
      </div>
    </div>
  );
}
