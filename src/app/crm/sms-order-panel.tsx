"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { createSmsOrderAction } from "./actions";

type Pack = { qty: number; price: number };

/** SMS package cards with an order button (manual admin-approval flow). */
export function SmsOrderPanel({ packages, hasPending }: { packages: Pack[]; hasPending: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function order(qty: number) {
    if (!confirm(`${qty} SMS paketi sifariş edilsin? Admin əlaqə saxlayıb ödənişi təsdiqləyəcək.`)) return;
    setBusy(qty);
    setError(null);
    const res = await createSmsOrderAction(qty);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {packages.map((p) => (
          <div key={p.qty} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink-900">{p.qty}</p>
            <p className="text-xs text-slate-500">SMS</p>
            <p className="mt-1 text-sm font-semibold text-brand-700">{p.price} ₼</p>
            <button
              type="button"
              disabled={busy != null || hasPending}
              onClick={() => order(p.qty)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy === p.qty ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              Sifariş et
            </button>
          </div>
        ))}
      </div>
      {hasPending && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Gözləyən sifarişiniz var — admin ödənişi təsdiqləyəndən sonra balans yüklənəcək.
        </p>
      )}
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
