"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Loader2, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { smartSearch, type SmartSearchResult } from "@/app/actions/search";

export type SmartSearchLabels = {
  placeholder: string;
  hint: string;
  searching: string;
  empty: string;
  allResults: string;
};

export function SmartSearch({ labels }: { labels: SmartSearchLabels }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SmartSearchResult[] | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const goAll = React.useCallback(() => {
    const q = query.trim();
    if (q.length < 2) return;
    window.location.href = `/rentgen-merkezleri?q=${encodeURIComponent(q)}`;
  }, [query]);

  function onChange(v: string) {
    setQuery(v);
    setActive(-1);
    if (timer.current) clearTimeout(timer.current);
    const q = v.trim();
    if (q.length < 2) {
      setResults(null);
      setSearching(false);
      setOpen(false);
      return;
    }
    setSearching(true);
    setOpen(true);
    timer.current = setTimeout(async () => {
      const res = await smartSearch(q);
      setResults(res);
      setSearching(false);
    }, 300);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const list = results ?? [];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (list.length) setActive((i) => (i + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (list.length) setActive((i) => (i <= 0 ? list.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (active >= 0 && list[active]) {
        e.preventDefault();
        window.location.href = `/rentgen-merkezleri/${list[active].slug}`;
      } else {
        e.preventDefault();
        goAll();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <div className="glow absolute -inset-2 -z-10 opacity-40" />
      <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 pl-4 shadow-xl backdrop-blur-md">
        <Search className="h-5 w-5 shrink-0 text-cyan-300" />
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (results) setOpen(true);
          }}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          className="w-full bg-transparent py-2 text-white placeholder:text-slate-400 focus:outline-none"
        />
        {searching ? (
          <Loader2 className="mr-2 h-5 w-5 shrink-0 animate-spin text-cyan-300" />
        ) : (
          <button
            type="button"
            onClick={goAll}
            aria-label={labels.allResults}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-ink-950 transition hover:bg-cyan-400"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <p className="mt-2 flex items-center gap-1.5 pl-1 text-xs text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
        {labels.hint}
      </p>

      {open && (results || searching) && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white text-ink-900 shadow-2xl">
          {searching && !results && (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {labels.searching}
            </div>
          )}
          {results && results.length === 0 && (
            <div className="px-4 py-4 text-sm text-slate-500">{labels.empty}</div>
          )}
          {results &&
            results.map((r, i) => (
              <Link
                key={r.slug}
                href={`/rentgen-merkezleri/${r.slug}`}
                onMouseEnter={() => setActive(i)}
                className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
                  active === i ? "bg-cyan-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                  <MapPin className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{r.name}</span>
                  {(r.district || r.city) && (
                    <span className="block truncate text-xs text-slate-500">
                      {[r.district, r.city].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {r.services.length > 0 && (
                    <span className="mt-0.5 block truncate text-xs text-cyan-700">
                      {r.services.join(" · ")}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          {results && results.length > 0 && (
            <button
              type="button"
              onClick={goAll}
              className="flex w-full items-center justify-center gap-1.5 bg-slate-50 px-4 py-3 text-sm font-medium text-cyan-700 transition hover:bg-slate-100"
            >
              {labels.allResults}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
