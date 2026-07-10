"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Wallet, Star, Crown, Gem } from "lucide-react";
import {
  purchasePlanFromWalletAction,
  startWalletTopupAction,
} from "@/app/actions/billing";
import { formatManat, PLAN_LABEL } from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";

const TIERS: { plan: Plan; icon: React.ReactNode }[] = [
  { plan: "SILVER", icon: <Star className="h-5 w-5" /> },
  { plan: "GOLD", icon: <Crown className="h-5 w-5" /> },
  { plan: "PLATINUM", icon: <Gem className="h-5 w-5" /> },
];

export function BillingPanel({
  currentPlan,
  planUntil,
  balance,
  prices,
}: {
  currentPlan: Plan;
  planUntil: string | null;
  balance: number;
  prices: Record<Plan, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [topup, setTopup] = React.useState("10");

  function buy(plan: Plan) {
    setMsg(null);
    setError(null);
    startTransition(async () => {
      const res = await purchasePlanFromWalletAction(plan);
      if (!res.ok) return setError(res.error ?? "Xəta baş verdi");
      setMsg(res.message ?? "Paket aktivləşdi.");
      router.refresh();
    });
  }

  function addFunds() {
    setMsg(null);
    setError(null);
    const manat = Number(topup);
    if (!Number.isFinite(manat) || manat < 1) return setError("Minimum 1 ₼.");
    startTransition(async () => {
      const res = await startWalletTopupAction(Math.round(manat * 100));
      if (!res.ok) return setError(res.error ?? "Xəta baş verdi");
      if (res.paymentUrl) window.location.href = res.paymentUrl;
    });
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> {msg}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Current plan + balance */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Cari paket</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900">
            {PLAN_LABEL[currentPlan]}
          </p>
          {planUntil && currentPlan !== "FREE" && (
            <p className="mt-1 text-xs text-slate-400">Bitmə tarixi: {planUntil}</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <Wallet className="h-4 w-4" /> Balans
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900">
            {formatManat(balance)}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                min={1}
                value={topup}
                onChange={(e) => setTopup(e.target.value)}
                className="h-10 w-24 rounded-xl border border-slate-200 pl-3 pr-7 text-sm"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                ₼
              </span>
            </div>
            <button
              type="button"
              onClick={addFunds}
              disabled={pending}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Balans artır
            </button>
          </div>
        </div>
      </div>

      {/* Plan purchase */}
      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map(({ plan, icon }) => {
          const active = currentPlan === plan;
          return (
            <div
              key={plan}
              className={`rounded-2xl border p-5 ${active ? "border-brand-300 bg-brand-50/40" : "border-slate-200 bg-white"}`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                {icon}
              </span>
              <p className="mt-3 font-display text-lg font-bold text-ink-900">{PLAN_LABEL[plan]}</p>
              <p className="mt-1 text-sm text-slate-500">
                <span className="text-xl font-bold text-ink-900">{formatManat(prices[plan])}</span> / ay
              </p>
              <button
                type="button"
                onClick={() => buy(plan)}
                disabled={pending}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {active ? "Yenilə" : "Balansla al"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Paket balansdan ödənilir və 30 günlük aktivləşir. Balans artırma Payriff (kart /
        Apple Pay) ilə həyata keçir.
      </p>
    </div>
  );
}
