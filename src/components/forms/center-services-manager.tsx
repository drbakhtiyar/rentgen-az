"use client";

import * as React from "react";
import { Loader2, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ServiceIcon } from "@/components/ui/service-icon";
import { cn } from "@/lib/utils";
import { saveCenterServicesAction } from "@/app/merkez/actions";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

export type ServiceRow = {
  serviceId: string;
  slug: string;
  name: string;
  icon?: string | null;
  iconUrl?: string | null;
  category?: string | null;
  enabled: boolean;
  price?: number | null;
  priceTo?: number | null;
  durationMin?: number | null;
  note?: string;
};

// Common service durations (minutes) for the CRM scheduler.
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120];

const azLower = (s: string) => s.toLocaleLowerCase("az");
const UNCATEGORIZED = "__other__";

export function CenterServicesManager({
  initial,
  categories = [],
  categoryLabels = {},
}: {
  initial: ServiceRow[];
  /** Ordered category keys (catalog order). */
  categories?: string[];
  /** AZ category → localized label. */
  categoryLabels?: Record<string, string>;
}) {
  const locale = useLocale();
  const t = getPanelDict(locale).center;
  const [rows, setRows] = React.useState<ServiceRow[]>(initial);
  const [activeCat, setActiveCat] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update(id: string, patch: Partial<ServiceRow>) {
    setRows((rs) => rs.map((r) => (r.serviceId === id ? { ...r, ...patch } : r)));
    setDone(false);
  }

  const q = azLower(query.trim());
  // Filter for DISPLAY only — save() always uses the full `rows`.
  const visible = rows.filter((r) => {
    if (activeCat && (r.category ?? UNCATEGORIZED) !== activeCat) return false;
    if (q && !azLower(r.name).includes(q)) return false;
    return true;
  });
  // Group visible rows by category, preserving catalog (row) order.
  const groupOrder: string[] = [];
  const groups = new Map<string, ServiceRow[]>();
  for (const r of visible) {
    const key = r.category ?? UNCATEGORIZED;
    if (!groups.has(key)) {
      groups.set(key, []);
      groupOrder.push(key);
    }
    groups.get(key)!.push(r);
  }
  const enabledInCat = (cat: string) =>
    rows.filter((r) => (r.category ?? UNCATEGORIZED) === cat && r.enabled).length;
  const otherLabel = locale === "ru" ? "Прочее" : "Digər";
  const catLabel = (c: string) => (c === UNCATEGORIZED ? otherLabel : categoryLabels[c] ?? c);

  function save() {
    setError(null);
    // Price is required for every enabled service.
    const missing = rows.some((r) => r.enabled && (r.price == null || r.price <= 0));
    if (missing) {
      setError(t.svcPriceRequired);
      return;
    }
    startTransition(async () => {
      const res = await saveCenterServicesAction(
        rows.map((r) => ({
          serviceId: r.serviceId,
          enabled: r.enabled,
          price: r.price ?? null,
          priceTo: null, // fixed price only — no per-center range
          durationMin: r.durationMin ?? 30,
          note: r.note,
        })),
      );
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setDone(true);
    });
  }

  const renderRow = (r: ServiceRow) => (
          <div
            key={r.serviceId}
            className={cn(
              "rounded-2xl border p-4 transition-colors",
              r.enabled ? "border-brand-200 bg-brand-50/40" : "border-slate-200 bg-white",
            )}
          >
            <div className="flex items-center gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => update(r.serviceId, { enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                />
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 ring-1 ring-slate-200">
                  <ServiceIcon name={r.icon} url={r.iconUrl} className="h-5 w-5" />
                </span>
                <span className="font-medium text-ink-900">{r.name}</span>
              </label>
            </div>

            {r.enabled && (
              <div className="mt-3 grid gap-3 pl-8 sm:grid-cols-[130px_130px_1fr]">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">
                    {t.svcPrice} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={r.price ?? ""}
                    onChange={(e) =>
                      update(r.serviceId, {
                        price: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder={t.svcPricePlaceholder}
                    className={cn(
                      "h-9",
                      r.price == null || r.price <= 0
                        ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                        : "",
                    )}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.svcDuration}</label>
                  <select
                    value={r.durationMin ?? 30}
                    onChange={(e) => update(r.serviceId, { durationMin: Number(e.target.value) })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm focus:border-brand-400 focus:outline-none"
                  >
                    {DURATION_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} {t.svcMinutes}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.svcNote}</label>
                  <Input
                    value={r.note ?? ""}
                    onChange={(e) => update(r.serviceId, { note: e.target.value })}
                    placeholder={t.svcNoteOptional}
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar: search + category chips (same grouping as the public site). */}
      <div className="sticky top-16 z-10 space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.svcSearchPh}
            className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCat(null)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors",
                activeCat === null
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {t.svcAllCats}
            </button>
            {categories.map((c) => {
              const n = enabledInCat(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCat(c)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors",
                    activeCat === c
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                  )}
                >
                  {categoryLabels[c] ?? c}
                  {n > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[11px] font-bold",
                        activeCat === c ? "bg-white/20 text-white" : "bg-brand-50 text-brand-700",
                      )}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grouped service rows (category headers preserve catalog order). */}
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
          {t.svcNoMatch}
        </p>
      ) : (
        groupOrder.map((cat) => (
          <div key={cat} className="space-y-3">
            <div className="flex items-center gap-2 pt-1">
              <h3 className="text-sm font-bold text-ink-900">{catLabel(cat)}</h3>
              <span className="text-xs text-slate-400">
                {enabledInCat(cat)} {t.svcEnabledShort}
              </span>
            </div>
            {groups.get(cat)!.map(renderRow)}
          </div>
        ))
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.svcSave}
        </Button>
        {done && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {t.svcSaved}
          </span>
        )}
      </div>
    </div>
  );
}
