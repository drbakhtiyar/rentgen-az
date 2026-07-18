"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, CheckCircle2, Wallet, AlertCircle } from "lucide-react";
import { buySmsPackageAction } from "./actions";

type Pack = { qty: number; price: number };

/**
 * SMS packages — instant purchase from the wallet balance (Payriff top-up).
 * `maxBuyable` caps what's currently in stock (platform keeps a reserve).
 */
export function SmsOrderPanel({
  packages,
  walletBalanceMinor,
  maxBuyable,
}: {
  packages: Pack[];
  walletBalanceMinor: number;
  /** null = stock unknown (provider unreachable) → no cap shown. */
  maxBuyable: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  const stockLimited = maxBuyable != null && maxBuyable < Math.max(...packages.map((p) => p.qty));

  async function buy(pack: Pack) {
    if (!confirm(`${pack.qty} SMS paketi alınsın? Balansdan ${pack.price} ₼ çıxılacaq.`)) return;
    setBusy(pack.qty);
    setError(null);
    setDone(null);
    const res = await buySmsPackageAction(pack.qty);
    setBusy(null);
    if (!res.ok) return setError(res.error);
    setDone(`${pack.qty} SMS balansınıza əlavə olundu.`);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Wallet className="h-4 w-4 text-brand-600" />
          Balansınız: <span className="font-semibold text-ink-900">{(walletBalanceMinor / 100).toFixed(2)} ₼</span>
        </span>
        <Link href="https://rentgen.az/merkez/paket" className="text-sm font-semibold text-brand-600 hover:underline">
          Balans artır →
        </Link>
      </div>

      {stockLimited && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Hazırda stokda maksimum <span className="font-semibold">{maxBuyable}</span> SMS almaq mümkündür — stok tezliklə artırılacaq.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {packages.map((p) => {
          const outOfStock = maxBuyable != null && p.qty > maxBuyable;
          const cantAfford = walletBalanceMinor < p.price * 100;
          return (
            <div key={p.qty} className={`rounded-xl border bg-white p-4 text-center ${outOfStock ? "border-slate-100 opacity-50" : "border-slate-200"}`}>
              <p className="font-display text-2xl font-bold text-ink-900">{p.qty.toLocaleString("az")}</p>
              <p className="text-xs text-slate-500">SMS</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">{p.price} ₼</p>
              <button
                type="button"
                disabled={busy != null || outOfStock}
                onClick={() => buy(p)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {busy === p.qty ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                {outOfStock ? "Stokda yoxdur" : "Al"}
              </button>
              {cantAfford && !outOfStock && (
                <p className="mt-1.5 text-[10px] text-amber-600">Balans kifayət etmir</p>
              )}
            </div>
          );
        })}
      </div>

      {done && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {done}
        </p>
      )}
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
