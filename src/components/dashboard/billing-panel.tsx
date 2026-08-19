"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Wallet, Star, Crown, Gem, AlertTriangle, HardDrive } from "lucide-react";
import {
  purchasePlanFromWalletAction,
  startWalletTopupAction,
  buyExtraStorageAction,
} from "@/app/actions/billing";
import {
  formatManat,
  PLAN_LABEL,
  priceForMonths,
  monthsDiscountPct,
  MIN_MONTHS,
  MAX_MONTHS,
} from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

/* Saytdakı /paketler metal kimliyi (2026-08-19) — Silver gümüşü, Gold qızılı,
 * Platinum buz-platin; chip-sheen parıltısı, hover-də ikon böyüyür, Platinum
 * daşı «nəfəs alır» (gem-breathe). Panel kartları ictimai səhifə ilə eynidir. */
const TIER_THEME: Record<string, { chip: string; iconExtra: string; ring: string; hover: string; name: string; sheen: boolean }> = {
  SILVER: {
    chip: "bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 text-slate-700 ring-1 ring-slate-300",
    iconExtra: "",
    ring: "ring-1 ring-slate-300 border-slate-200",
    hover: "hover:shadow-[0_24px_60px_-24px_rgba(100,116,139,0.55)] hover:ring-slate-400",
    name: "bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 bg-clip-text text-transparent",
    sheen: true,
  },
  GOLD: {
    chip: "bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-500 text-amber-900 ring-1 ring-amber-300",
    iconExtra: "",
    ring: "ring-2 ring-amber-300 border-amber-200",
    hover: "hover:shadow-[0_24px_60px_-24px_rgba(245,158,11,0.55)] hover:ring-amber-400",
    name: "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent",
    sheen: true,
  },
  PLATINUM: {
    chip: "bg-gradient-to-br from-slate-200 via-white to-cyan-200 text-cyan-700 ring-1 ring-cyan-200",
    iconExtra: "gem-breathe",
    ring: "ring-1 ring-cyan-200 border-cyan-200",
    hover: "hover:shadow-[0_24px_60px_-24px_rgba(34,211,238,0.5)] hover:ring-cyan-300",
    name: "bg-gradient-to-r from-cyan-700 via-slate-500 to-cyan-700 bg-clip-text text-transparent",
    sheen: true,
  },
};

const TIERS: { plan: Plan; icon: React.ReactNode }[] = [
  { plan: "SILVER", icon: <Star className="h-5 w-5" /> },
  { plan: "GOLD", icon: <Crown className="h-5 w-5" /> },
  { plan: "PLATINUM", icon: <Gem className="h-5 w-5" /> },
];

const MONTH_OPTIONS = Array.from({ length: MAX_MONTHS - MIN_MONTHS + 1 }, (_, i) => MIN_MONTHS + i);

export function BillingPanel({
  currentPlan,
  planUntil,
  daysLeft,
  balance,
  prices,
  extraStorage,
  preselect,
}: {
  currentPlan: Plan;
  planUntil: string | null;
  daysLeft: number | null;
  balance: number;
  prices: Record<Plan, number>;
  /** Platinum centers: active +1TB blocks + price (section hidden if absent). */
  extraStorage?: { tb: number; until: string | null; priceMinor: number } | null;
  /** Plan preselected via ?plan= (highlighted + scrolled into view). */
  preselect?: Plan | null;
}) {
  const router = useRouter();
  const t = getPanelDict(useLocale()).center;
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [topup, setTopup] = React.useState("10");
  const [months, setMonths] = React.useState(1);
  const plansRef = React.useRef<HTMLDivElement>(null);

  // Scroll to the plan grid when arriving from /paketler with a preselection.
  React.useEffect(() => {
    if (preselect && preselect !== "FREE") {
      plansRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [preselect]);

  const discountPct = monthsDiscountPct(months);
  const expiringSoon = daysLeft != null && daysLeft <= 5 && currentPlan !== "FREE";

  function buy(plan: Plan) {
    setMsg(null);
    setError(null);
    startTransition(async () => {
      const res = await purchasePlanFromWalletAction(plan, months);
      if (!res.ok) return setError(res.error ?? t.apiError);
      setMsg(res.message ?? t.payActivated);
      router.refresh();
    });
  }

  function buyStorage() {
    setMsg(null);
    setError(null);
    startTransition(async () => {
      const res = await buyExtraStorageAction();
      if (!res.ok) return setError(res.error ?? t.apiError);
      setMsg(res.message ?? "");
      router.refresh();
    });
  }

  function addFunds() {
    setMsg(null);
    setError(null);
    const manat = Number(topup);
    if (!Number.isFinite(manat) || manat < 1) return setError(t.payMinTopup);
    startTransition(async () => {
      const res = await startWalletTopupAction(Math.round(manat * 100));
      if (!res.ok) return setError(res.error ?? t.apiError);
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
          <p className="text-sm text-slate-500">{t.currentPackage}</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900">
            {PLAN_LABEL[currentPlan]}
          </p>
          {planUntil && currentPlan !== "FREE" && (
            <p className="mt-1 text-xs text-slate-400">{t.activeUntilPre} {planUntil}{t.activeUntilPost}</p>
          )}
          {expiringSoon && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t.expiringShort}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <Wallet className="h-4 w-4" /> {t.balanceLabel}
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
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t.topupBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Duration selector */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="text-sm font-medium text-slate-700">{t.durationLabel}</label>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"
        >
          {MONTH_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} {t.monthWord}{monthsDiscountPct(m) > 0 ? ` (−${monthsDiscountPct(m)}%)` : ""}
            </option>
          ))}
        </select>
        {discountPct > 0 && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {discountPct}% {t.discountApplied}
          </span>
        )}
      </div>

      {/* Plan purchase */}
      <div ref={plansRef} className="grid gap-4 sm:grid-cols-3">
        {TIERS.map(({ plan, icon }) => {
          const active = currentPlan === plan;
          const picked = preselect === plan && !active;
          const total = priceForMonths(prices[plan], months);
          const full = prices[plan] * months;
          const th = TIER_THEME[plan];
          return (
            <div
              key={plan}
              className={`group rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-1 ${th?.ring ?? "border-slate-200"} ${th?.hover ?? ""} ${
                picked ? "ring-2 ring-brand-400" : active ? "bg-brand-50/30" : ""
              }`}
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${th?.chip ?? "bg-slate-100 text-slate-700"} ${th?.sheen ? "chip-sheen" : ""}`}>
                <span className={th?.iconExtra ?? ""}>{icon}</span>
              </span>
              <p className={`mt-3 font-display text-lg font-bold ${th?.name ?? "text-ink-900"}`}>{PLAN_LABEL[plan]}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold text-ink-900">{formatManat(total)}</span>
                {discountPct > 0 && (
                  <span className="text-sm text-slate-400 line-through">{formatManat(full)}</span>
                )}
              </div>
              <p className="text-xs text-slate-500">{months} {t.monthWord} · {formatManat(prices[plan])}{t.perMonth}</p>
              <button
                type="button"
                onClick={() => buy(plan)}
                disabled={pending}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {active ? t.extend : t.buyWithBalance}
              </button>
            </div>
          );
        })}
      </div>

      {/* +1 TB overage blocks (Platinum centers) */}
      {extraStorage && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 font-display text-lg font-bold text-ink-900">
                <HardDrive className="h-5 w-5 text-brand-600" /> Əlavə yaddaş
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Hər blok: <span className="font-semibold text-ink-900">+1 TB · {formatManat(extraStorage.priceMinor)}</span> · 30 gün qüvvədə
              </p>
              {extraStorage.tb > 0 ? (
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  Aktiv: +{extraStorage.tb} TB{extraStorage.until ? ` (${extraStorage.until}-ə kimi)` : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Hazırda əlavə blok yoxdur.</p>
              )}
            </div>
            <button
              type="button"
              onClick={buyStorage}
              disabled={pending}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} +1 TB al
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">{t.billingNote}</p>
    </div>
  );
}
