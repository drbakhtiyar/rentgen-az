"use client";

import * as React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
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
  enabled: boolean;
  price?: number | null;
  priceTo?: number | null;
  note?: string;
};

export function CenterServicesManager({ initial }: { initial: ServiceRow[] }) {
  const t = getPanelDict(useLocale()).center;
  const [rows, setRows] = React.useState<ServiceRow[]>(initial);
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update(id: string, patch: Partial<ServiceRow>) {
    setRows((rs) => rs.map((r) => (r.serviceId === id ? { ...r, ...patch } : r)));
    setDone(false);
  }

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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map((r) => (
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
              <div className="mt-3 grid gap-3 pl-8 sm:grid-cols-[140px_1fr]">
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
        ))}
      </div>

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
