"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, CalendarOff } from "lucide-react";
import { addHolidayAction, deleteHolidayAction } from "./actions";
import { useLocale } from "@/components/locale-context";
import { getCrmDict } from "@/lib/i18n-crm";

type Holiday = { id: string; date: string; reason: string | null };

const field = "rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none";

/** Manage non-working days (holidays): list + add + delete. */
export function HolidaysManager({ initial }: { initial: Holiday[] }) {
  const router = useRouter();
  const t = getCrmDict(useLocale());
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date") ?? "");
    if (!date) return;
    setBusy(true);
    setError(null);
    const res = await addHolidayAction({ date, reason: (fd.get("reason") as string) || null });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    await deleteHolidayAction(id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {t.holidays.desc}
      </p>

      {initial.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {initial.map((h) => (
            <li key={h.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <CalendarOff className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="font-semibold text-ink-900">{h.date}</span>
              {h.reason && <span className="text-slate-500">· {h.reason}</span>}
              <button
                type="button"
                onClick={() => remove(h.id)}
                disabled={busy}
                className="ml-auto rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title={t.common.del}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">{t.holidays.empty}</p>
      )}

      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">{t.holidays.dateLabel}</label>
          <input name="date" type="date" required className={field} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-500">{t.holidays.reasonLabel}</label>
          <input name="reason" className={`${field} w-full`} placeholder={t.holidays.reasonPh} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t.holidays.add}
        </button>
      </form>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
