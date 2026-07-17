"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Gift } from "lucide-react";
import {
  approveSmsOrderAction,
  cancelSmsOrderAction,
  grantCenterSmsAction,
} from "@/app/admin/actions";

export type SmsOrderRow = {
  id: string;
  qty: number;
  price: number;
  status: string;
  createdAt: string;
  centerName: string;
  centerPhone: string;
};

type CenterOpt = { id: string; name: string; balance: number };

/** Admin: approve/cancel CRM SMS package orders + manual credit grants. */
export function SmsOrdersPanel({ orders, centers }: { orders: SmsOrderRow[]; centers: CenterOpt[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(id: string, fn: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    setBusy(id);
    setError(null);
    const res = await fn(id);
    setBusy(null);
    if (!res.ok) return setError(res.error ?? "Xəta");
    router.refresh();
  }

  async function grant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const centerId = String(fd.get("centerId") ?? "");
    const amount = Number(fd.get("amount") ?? 0);
    if (!centerId || !amount) return;
    setBusy("grant");
    setError(null);
    const res = await grantCenterSmsAction(centerId, amount, String(fd.get("note") ?? "") || undefined);
    setBusy(null);
    if (!res.ok) return setError(res.error ?? "Xəta");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  const field = "rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-brand-400 focus:outline-none";

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <p className="text-sm text-slate-400">Gözləyən sifariş yoxdur.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">
                  {o.centerName} <span className="font-normal text-slate-500">· {o.centerPhone}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {o.qty} SMS · {o.price} ₼ · {o.createdAt}
                </p>
              </div>
              <button
                type="button"
                disabled={busy === o.id}
                onClick={() => run(o.id, approveSmsOrderAction)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Ödənildi — təsdiqlə
              </button>
              <button
                type="button"
                disabled={busy === o.id}
                onClick={() => {
                  if (confirm("Sifariş ləğv edilsin?")) run(o.id, cancelSmsOrderAction);
                }}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" /> Ləğv
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Manual grant */}
      <form onSubmit={grant} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Mərkəz</label>
          <select name="centerId" required className={field}>
            <option value="">— Seç —</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (qalıq: {c.balance})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">SMS sayı</label>
          <input name="amount" type="number" min={1} max={100000} required className={`${field} w-24`} />
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Qeyd</label>
          <input name="note" className={`${field} w-full`} placeholder="hədiyyə / düzəliş" />
        </div>
        <button
          type="submit"
          disabled={busy === "grant"}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy === "grant" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}
          Yüklə
        </button>
      </form>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
