"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { ALL_SPECIALIZATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Axtarışlı ixtisas seçicisi (2026-08-19): siyahı böyüdüyü üçün bütün çipləri
 * göstərmirik — həkim yazır, fold-fuzzy uyğunlar çıxır, klik seçir.
 * «Ağıllı» uyğunluq: diakritik fold (ə→e...), translit (sh→ş), sözün istənilən
 * yerində axtarış və sadə hərf-buraxma dözümü (məs. «kardiolq» → Kardioloq).
 */

const fold = (x: string) =>
  x
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/ə/g, "e")
    .replace(/[ıî]/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c");

/** Sadə subsequence yoxlaması — «kardilq» kimi hərf buraxılışlarını tutur. */
function subseq(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
}

export function SpecializationsPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const nq = fold(q.trim());
  const matches = React.useMemo(() => {
    const pool = ALL_SPECIALIZATIONS.filter((s) => !value.includes(s));
    if (!nq) return pool.slice(0, 8);
    const scored = pool
      .map((s) => {
        const f = fold(s);
        let score = -1;
        if (f.startsWith(nq)) score = 0;
        else if (f.includes(nq)) score = 1;
        else if (nq.length >= 4 && subseq(nq, f)) score = 2;
        return { s, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => a.score - b.score);
    return scored.slice(0, 8).map((x) => x.s);
  }, [nq, value]);

  return (
    <div ref={boxRef} className="relative">
      {/* Seçilmişlər */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              {s}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== s))} aria-label={`${s} sil`}>
                <X className="h-3.5 w-3.5 opacity-80 hover:opacity-100" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Axtarış */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "İxtisas yazın — məs. kardioloq, radioloq..."}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-400"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange([...value, s]); setQ(""); }}
              className={cn("block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700")}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
