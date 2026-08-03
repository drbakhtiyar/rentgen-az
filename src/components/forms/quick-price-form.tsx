"use client";

import * as React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePricesAction } from "@/app/q/[token]/actions";

type Row = { centerServiceId: string; serviceName: string; category: string | null; price: number | null };

/** Girişsiz sürətli qiymət formu — hər sətir bir rəqəm qutusu. */
export function QuickPriceForm({ token, rows }: { token: string; rows: Row[] }) {
  const [values, setValues] = React.useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.centerServiceId, r.price != null ? String(r.price) : ""])),
  );
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<number | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await savePricesAction({
        token,
        prices: rows.map((r) => {
          const raw = values[r.centerServiceId]?.trim() ?? "";
          const n = raw === "" ? null : Number(raw);
          return { centerServiceId: r.centerServiceId, price: n != null && Number.isFinite(n) ? Math.round(n) : null };
        }),
      });
      if (!res.ok) setError(res.error ?? "Xəta");
      else setDone(res.saved ?? 0);
    });
  }

  if (done != null) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <p className="mt-4 text-base font-semibold text-ink-900">
          Təşəkkürlər! {done} xidmətin qiyməti yadda saxlanıldı.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Qiymətlər saytda dərhal görünür. Sonradan dəyişmək üçün eyni linkdən istifadə edə bilərsiniz.
        </p>
      </div>
    );
  }

  // Kateqoriya üzrə qruplaşdır
  const byCat = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r.category ?? "Digər";
    byCat.set(k, [...(byCat.get(k) ?? []), r]);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {[...byCat.entries()].map(([cat, list]) => (
        <div key={cat}>
          {byCat.size > 1 && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{cat}</p>
          )}
          <div className="space-y-2">
            {list.map((r) => (
              <label
                key={r.centerServiceId}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200"
              >
                <span className="text-sm font-medium text-ink-900">{r.serviceName}</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={10000}
                    value={values[r.centerServiceId] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [r.centerServiceId]: e.target.value }))
                    }
                    placeholder="—"
                    className="h-10 w-24 rounded-lg border border-slate-300 bg-white px-3 text-right text-sm font-semibold text-ink-900 outline-none focus:border-brand-500"
                  />
                  <span className="text-sm font-semibold text-slate-500">₼</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yadda saxla"}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Bilmədiyiniz xidməti boş buraxın — yalnız doldurduqlarınız yazılır.
      </p>
    </form>
  );
}
