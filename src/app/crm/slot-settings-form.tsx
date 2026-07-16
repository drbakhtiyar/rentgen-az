"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { updateSlotSettingsAction } from "./actions";

/** Center CRM slot settings: enable online booking, grid step, capacity. */
export function SlotSettingsForm({
  enabled,
  slotMinutes,
  slotCapacity,
}: {
  enabled: boolean;
  slotMinutes: number;
  slotCapacity: number;
}) {
  const router = useRouter();
  const [on, setOn] = React.useState(enabled);
  const [step, setStep] = React.useState(slotMinutes);
  const [cap, setCap] = React.useState(slotCapacity);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await updateSlotSettingsAction({ enabled: on, slotMinutes: step, slotCapacity: cap });
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
