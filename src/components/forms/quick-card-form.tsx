"use client";

import * as React from "react";
import { Loader2, CheckCircle2, Plus, Search, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveCardAction } from "@/app/m/[token]/actions";
import { DAY_KEYS, DAY_LABELS_AZ, type DayKey, type WeeklyHours } from "@/lib/hours";

type Row = { centerServiceId: string; serviceName: string; category: string | null; price: number | null };
type Addable = { serviceId: string; name: string; category: string | null };

function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g");
}

type DayState = { closed: boolean; open: string; close: string };

/**
 * Girişsiz KART formu: xidmət təsdiqi (checkbox — çıxart), "+" ilə əlavə,
 * qiymətlər və iş saatları — hamısı bir səhifədə (istifadəçi istəyi).
 */
export function QuickCardForm({
  token,
  rows,
  addable,
  initialHours,
}: {
  token: string;
  rows: Row[];
  addable: Addable[];
  initialHours: WeeklyHours | null;
}) {
  const [kept, setKept] = React.useState<Record<string, boolean>>(
    Object.fromEntries(rows.map((r) => [r.centerServiceId, true])),
  );
  const [values, setValues] = React.useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.centerServiceId, r.price != null ? String(r.price) : ""])),
  );
  const [added, setAdded] = React.useState<Addable[]>([]);
  const [addedPrices, setAddedPrices] = React.useState<Record<string, string>>({});
  const [picking, setPicking] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [days, setDays] = React.useState<Record<DayKey, DayState>>(() => {
    const out = {} as Record<DayKey, DayState>;
    for (const k of DAY_KEYS) {
      const d = initialHours?.[k] ?? null;
      out[k] = d ? { closed: false, open: d.open, close: d.close } : { closed: true, open: "09:00", close: "18:00" };
    }
    return out;
  });
  const [touchedHours, setTouchedHours] = React.useState(!!initialHours);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  const addedIds = new Set(added.map((a) => a.serviceId));
  const found =
    query.trim().length >= 2
      ? addable.filter((a) => !addedIds.has(a.serviceId) && fold(a.name).includes(fold(query))).slice(0, 8)
      : [];
  const removedCount = rows.filter((r) => !kept[r.centerServiceId]).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const toInt = (raw: string | undefined) => {
      const t = raw?.trim() ?? "";
      if (t === "") return null;
      const n = Number(t);
      return Number.isFinite(n) ? Math.round(n) : null;
    };
    const hours: WeeklyHours | null = touchedHours
      ? (Object.fromEntries(
          DAY_KEYS.map((k) => [k, days[k].closed ? null : { open: days[k].open, close: days[k].close }]),
        ) as WeeklyHours)
      : null;
    startTransition(async () => {
      const res = await saveCardAction({
        token,
        keep: rows
          .filter((r) => kept[r.centerServiceId])
          .map((r) => ({ centerServiceId: r.centerServiceId, price: toInt(values[r.centerServiceId]) })),
        additions: added.map((a) => ({ serviceId: a.serviceId, price: toInt(addedPrices[a.serviceId]) })),
        hours,
      });
      if (!res.ok) setError(res.error ?? "Xəta");
      else setDone(res.summary ?? "");
    });
  }

  if (done != null) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <p className="mt-4 text-base font-semibold text-ink-900">Təşəkkürlər! {done}.</p>
        <p className="mt-2 text-sm text-slate-500">
          Dəyişikliklər saytda dərhal görünür. Sonradan düzəliş üçün eyni linkdən
          istifadə edə bilərsiniz. Loqo və bina fotosunu isə WhatsApp çatımıza göndərin.
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
    <form onSubmit={submit} className="space-y-6">
      {/* ------- 1. Xidmətlər ------- */}
      <div>
        <h2 className="font-display text-base font-bold text-ink-900">1. Xidmətlərinizi təsdiqləyin</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Göstərmədiyiniz xidmətin işarəsini çıxarın — kartınızdan silinəcək.
          Qiyməti bildiyiniz xidmətin qarşısına yazın (boş qala bilər).
        </p>
        {removedCount > 0 && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
            {removedCount} xidmət silinəcək
          </p>
        )}
        <div className="mt-3 space-y-4">
          {[...byCat.entries()].map(([cat, list]) => (
            <div key={cat}>
              {byCat.size > 1 && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{cat}</p>
              )}
              <div className="space-y-2">
                {list.map((r) => {
                  const on = kept[r.centerServiceId];
                  return (
                    <div
                      key={r.centerServiceId}
                      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ring-1 transition-colors ${
                        on ? "bg-slate-50 ring-slate-200" : "bg-rose-50/50 ring-rose-200"
                      }`}
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) =>
                            setKept((k) => ({ ...k, [r.centerServiceId]: e.target.checked }))
                          }
                          className="h-4 w-4 shrink-0 accent-brand-600"
                        />
                        <span
                          className={`truncate text-sm font-medium ${
                            on ? "text-ink-900" : "text-slate-400 line-through"
                          }`}
                        >
                          {r.serviceName}
                        </span>
                      </label>
                      {on && (
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
                            className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-2 text-right text-sm font-semibold text-ink-900 outline-none focus:border-brand-500"
                          />
                          <span className="text-sm font-semibold text-slate-500">₼</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Əlavə edilənlər */}
        {added.length > 0 && (
          <div className="mt-4">
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
                      onChange={(e) => setAddedPrices((p) => ({ ...p, [a.serviceId]: e.target.value }))}
                      placeholder="—"
                      className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-2 text-right text-sm font-semibold text-ink-900 outline-none focus:border-brand-500"
                    />
                    <span className="text-sm font-semibold text-slate-500">₼</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* + kataloqdan əlavə */}
        {addable.length > addedIds.size && (
          <div className="mt-3">
            {!picking ? (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 hover:border-brand-300 hover:text-brand-600"
              >
                <Plus className="h-4 w-4" /> Siyahıda olmayan xidməti əlavə et
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
                            {a.category && <span className="text-xs text-slate-400">{a.category}</span>}
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
      </div>

      {/* ------- 2. İş saatları ------- */}
      <div>
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
          <Clock className="h-4 w-4 text-brand-500" /> 2. İş saatlarınız
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Bağlı olduğunuz günün işarəsini çıxarın. Doldurmasanız, qrafikə toxunulmur.
        </p>
        <div className="mt-3 space-y-1.5">
          {DAY_KEYS.map((k) => {
            const d = days[k];
            return (
              <div key={k} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                <label className="flex w-20 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!d.closed}
                    onChange={(e) => {
                      setTouchedHours(true);
                      setDays((s) => ({ ...s, [k]: { ...s[k], closed: !e.target.checked } }));
                    }}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className="text-sm font-medium text-ink-900">{DAY_LABELS_AZ[k]}</span>
                </label>
                {d.closed ? (
                  <span className="text-xs text-slate-400">bağlıdır</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm">
                    <input
                      type="time"
                      value={d.open}
                      onChange={(e) => {
                        setTouchedHours(true);
                        setDays((s) => ({ ...s, [k]: { ...s[k], open: e.target.value } }));
                      }}
                      className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-sm outline-none focus:border-brand-500"
                    />
                    –
                    <input
                      type="time"
                      value={d.close}
                      onChange={(e) => {
                        setTouchedHours(true);
                        setDays((s) => ({ ...s, [k]: { ...s[k], close: e.target.value } }));
                      }}
                      className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-sm outline-none focus:border-brand-500"
                    />
                    {k === "mon" && (
                      <button
                        type="button"
                        onClick={() => {
                          setTouchedHours(true);
                          setDays((s) => {
                            const src = s.mon;
                            const out = { ...s };
                            for (const kk of DAY_KEYS) if (!out[kk].closed) out[kk] = { ...out[kk], open: src.open, close: src.close };
                            return out;
                          });
                        }}
                        className="ml-2 whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-100"
                      >
                        hamısına tətbiq et
                      </button>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ------- 3. Foto qeydi ------- */}
      <div className="rounded-xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-800 ring-1 ring-brand-100">
        <strong>3. Loqo və bina fotosu:</strong> ayrıca yükləməyə ehtiyac yoxdur —
        loqonuzu və mərkəzin giriş fotosunu elə sizə yazdığımız WhatsApp çatına
        göndərin, komandamız kartınıza yerləşdirəcək.
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yadda saxla"}
      </Button>
    </form>
  );
}
