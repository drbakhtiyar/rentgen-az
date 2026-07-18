"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { addManualAppointmentAction } from "./actions";
import { useLocale } from "@/components/locale-context";
import { getCrmDict } from "@/lib/i18n-crm";

type Svc = { slug: string; name: string };

/** Center-side "add patient by hand" form (walk-ins / external customers). */
export function ManualAppointmentForm({
  services,
  defaultYmd,
}: {
  services: Svc[];
  defaultYmd?: string;
}) {
  const router = useRouter();
  const t = getCrmDict(useLocale());
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await addManualAppointmentAction({
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      serviceSlug: (fd.get("serviceSlug") as string) || null,
      ymd: (fd.get("ymd") as string) || null,
      time: (fd.get("time") as string) || null,
      note: (fd.get("note") as string) || null,
      confirmed,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    (e.target as HTMLFormElement).reset();
    setConfirmed(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" /> {t.common.addPatient}
      </button>
    );
  }

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-bold text-ink-900">{t.forms.newTitle}</h3>
        <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">{t.forms.nameLabel}</label>
          <input name="name" required className={field} placeholder={t.forms.namePh} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">{t.forms.phoneLabel}</label>
          <input name="phone" required className={field} placeholder={t.forms.phonePh} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">{t.forms.serviceLabel}</label>
          <select name="serviceSlug" className={field} defaultValue="">
            <option value="">{t.forms.serviceNone}</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">{t.forms.dateLabel}</label>
            <input name="ymd" type="date" defaultValue={defaultYmd} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">{t.forms.timeLabel}</label>
            <input name="time" type="time" className={field} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-500">{t.forms.noteLabel}</label>
          <input name="note" className={field} placeholder={t.forms.notePh} />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        {t.forms.confirmedNote}
      </label>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t.forms.add}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
