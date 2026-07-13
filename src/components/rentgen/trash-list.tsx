"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2, Loader2, File as FileIcon, AlarmClock } from "lucide-react";
import {
  restoreFileAction,
  purgeFileAction,
  emptyTrashAction,
} from "@/app/actions/rentgen-files";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

export type TrashItem = {
  id: string;
  fileName: string;
  size: number;
  patientName: string;
  deletedAtLabel: string;
  daysLeft: number | null;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** Center-side trash bin: restore or permanently delete soft-deleted files. */
export function TrashList({ items }: { items: TrashItem[] }) {
  const router = useRouter();
  const t = getPanelDict(useLocale()).center;
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function restore(id: string) {
    setError(null);
    setBusy(id);
    const res = await restoreFileAction(id);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  async function purge(id: string) {
    if (!confirm(t.trConfirmPurge)) return;
    setError(null);
    setBusy(id);
    const res = await purgeFileAction(id);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  async function empty() {
    if (!confirm(t.trConfirmEmpty)) return;
    setError(null);
    setBusy("__all__");
    const res = await emptyTrashAction();
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{t.trEmpty}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{items.length} {t.trCount}</p>
        <button
          type="button"
          onClick={empty}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          {busy === "__all__" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {t.trEmptyBtn}
        </button>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
        {items.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm">
            <FileIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-ink-800">{f.fileName}</p>
              <p className="text-xs text-slate-400">
                {f.patientName} · {formatBytes(f.size)} · {t.trDeletedAt} {f.deletedAtLabel}
              </p>
            </div>
            {f.daysLeft !== null && (
              <span
                className={
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                  (f.daysLeft <= 3
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-700")
                }
              >
                <AlarmClock className="h-3 w-3" />
                {f.daysLeft <= 0 ? t.trToday : `${f.daysLeft} ${t.trDaysLeft}`}
              </span>
            )}
            <button
              type="button"
              onClick={() => restore(f.id)}
              disabled={!!busy}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {busy === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              {t.trRestore}
            </button>
            <button
              type="button"
              onClick={() => purge(f.id)}
              disabled={!!busy}
              className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              title={t.trPurgeTitle}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
