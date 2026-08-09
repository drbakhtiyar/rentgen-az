"use client";

import * as React from "react";
import { Loader2, CheckCircle2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePricesAction } from "@/app/q/[token]/actions";

type Row = { centerServiceId: string; serviceName: string; category: string | null; price: number | null };
type Addable = { serviceId: string; name: string; category: string | null };

/** "beyaz dis" ~ "Bəyaz Diş" — diakritik-həssas olmayan axtarış. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g");
}

/**
 * Girişsiz sürətli qiymət formu — hər sətir bir rəqəm qutusu.
 * "+" düyməsi: mərkəz bizim göstərdiyimizdən çox xidmət verə bilər —
 * kataloqun qalanından axtarıb seçir, qiymətini yazır (istifadəçi istəyi).
 */
export function QuickPriceForm({
  token,
  rows,
  addable,
}: {
  token: string;
  rows: Row[];
  addable: Addable[];
}) {
  const [values, setValues] = React.useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.centerServiceId, r.price != null ? String(r.price) : ""])),
  );
  const [added, setAdded] = React.useState<Addable[]>([]);
  const [addedPrices, setAddedPrices] = React.useState<Record<string, string>>({});
  const [picking, setPicking] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<number | null>(null);

  const addedIds = new Set(added.map((a) => a.serviceId));
  const found =
    query.trim().length >= 2
      ? addable.filter((a) => !addedIds.has(a.serviceId) && fold(a.name).includes(fold(query))).slice(0, 8)
      : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const toInt = (raw: string | undefined) => {
      const t = raw?.trim() ?? "";
      if (t === "") return null;
      const n = Number(t);
      return Number.isFinite(n) ? Math.round(n) : null;
    };
    startTransition(async () => {
      const res = await savePricesAction({
        token,
        prices: rows.map((r) => ({
          centerServiceId: r.centerServiceId,
          price: toInt(values[r.centerServiceId]),
        })),
        additions: added.map((a) => ({ serviceId: a.serviceId, price: toInt(addedPrices[a.serviceId]) })),
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

      {/* Əl ilə əlavə edilən yeni xidmətlər */}
      {added.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Əlavə etdiyiniz xidmətlər
          </p>
          <div className="space-y-2">
            {added.map((a) => (
              <div
                key={a.serviceId}
                className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/60 px-4 py-3 ring-1 ring-emerald-200"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label="Sil"
                    onClick={() => {
                      setAdded((l) => l.filter((x) => x.serviceId !== a.serviceId));
                      setAddedPrices((p) => {
                        const rest = { ...p };
                        delete rest[a.serviceId];
                        return rest;
                      });
                    }}
                    className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-white hover:text-rose-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="truncate text-sm font-medium text-ink-900">{a.name}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={10000}
                    value={addedPrices[a.serviceId] ?? ""}
                    onChange={(e) =>
                      setAddedPrices((p) => ({ ...p, [a.serviceId]: e.target.value }))
                    }
                    placeholder="—"
                    className="h-10 w-24 rounded-lg border border-slate-300 bg-white px-3 text-right text-sm font-semibold text-ink-900 outline-none focus:border-brand-500"
                  />
                  <span className="text-sm font-semibold text-slate-500">₼</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "+" — kataloqdan yeni xidmət seçimi */}
      {addable.length > addedIds.size && (
        <div>
          {!picking ? (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 hover:border-brand-300 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" /> Başqa xidmət əlavə et
            </button>
          ) : (
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Xidmətin adını yazın… (məs: baş MRT)"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  aria-label="Bağla"
                  onClick={() => {
                    setPicking(false);
                    setQuery("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {query.trim().length >= 2 && (
                <div className="mt-2 space-y-1">
                  {found.length > 0 ? (
                    found.map((a) => (
                      <button
                        key={a.serviceId}
                        type="button"
                        onClick={() => {
                          setAdded((l) => [...l, a]);
                          setQuery("");
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink-900">{a.name}</span>
                          {a.category && (
                            <span className="text-xs text-slate-400">{a.category}</span>
                          )}
                        </span>
                        <Plus className="h-4 w-4 shrink-0 text-brand-500" />
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-slate-400">Uyğun xidmət tapılmadı.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
