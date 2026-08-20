"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Stethoscope, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { smartMatch } from "@/components/forms/suggest-input";

type Option = { value: string; label: string };

export type SearchLabels = {
  service: string;
  allServices: string;
  city: string;
  allCities: string;
  centerName: string;
  centerNamePlaceholder: string;
  search: string;
  noMatches?: string;
};

const AZ_LABELS: SearchLabels = {
  service: "Xidmət",
  allServices: "Bütün xidmətlər",
  city: "Rayon / şəhər",
  allCities: "Bütün rayonlar",
  centerName: "Mərkəz və ya xidmət adı",
  centerNamePlaceholder: "Mərkəz və ya xidmət adı",
  search: "Axtar",
  noMatches: "Uyğun variant tapılmadı",
};

/**
 * Yazılan açılan seçici (2026-08-21, istifadəçi istəyi): uzun xidmət/rayon
 * siyahısından seçmək çətindir — istifadəçi yazır, fold-fuzzy uyğunlar çıxır
 * (səhv yazılışa dözümlü: «ayag» → Ayaq, «gence» → Gəncə). Boş fokusda ilk
 * 10 variant görünür ki, siyahını gözdən keçirmək də mümkün olsun.
 */
function SmartCombo({
  options,
  value,
  allLabel,
  noMatches,
  ariaLabel,
  onChange,
}: {
  options: Option[];
  value: string;
  allLabel: string;
  noMatches: string;
  ariaLabel: string;
  onChange: (v: string) => void;
}) {
  const picked = options.find((o) => o.value === value) ?? null;
  const [text, setText] = React.useState(picked?.label ?? "");
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Xarici dəyişiklik (URL-dən default) mətni sinxronlaşdırır
  React.useEffect(() => {
    setText(picked?.label ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setText(picked?.label ?? "");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const q = text.trim();
  const matches = q && (!picked || q !== picked.label)
    ? options.filter((o) => smartMatch(o.label, q)).slice(0, 10)
    : options.slice(0, 10);

  function pick(o: Option | null) {
    setText(o?.label ?? "");
    setOpen(false);
    onChange(o?.value ?? "");
  }

  return (
    <div ref={boxRef} className="relative">
      <Input
        value={text}
        autoComplete="off"
        placeholder={allLabel}
        aria-label={ariaLabel}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="pr-9"
      />
      {picked ? (
        <button
          type="button"
          aria-label="Təmizlə"
          onClick={() => pick(null)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">{noMatches}</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {!q && (
                <li>
                  <button
                    type="button"
                    onClick={() => pick(null)}
                    className="block w-full px-3 py-2 text-left text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    {allLabel}
                  </button>
                </li>
              )}
              {matches.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => pick(o)}
                    className="block w-full px-3 py-2 text-left text-sm text-ink-900 hover:bg-brand-50"
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function SearchPanel({
  services,
  cities,
  defaults,
  variant = "hero",
  labels = AZ_LABELS,
}: {
  services: Option[];
  cities: Option[];
  defaults?: { q?: string; city?: string; service?: string };
  variant?: "hero" | "compact";
  labels?: SearchLabels;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState(defaults?.q ?? "");
  const [city, setCity] = React.useState(defaults?.city ?? "");
  const [service, setService] = React.useState(defaults?.service ?? "");

  // On the centers page (compact) the pickers filter instantly — no need to
  // press "Axtar". The free-text field still submits via the button / Enter.
  const autoFilter = variant === "compact";

  function go(next: { q?: string; city?: string; service?: string }) {
    const params = new URLSearchParams();
    const nq = (next.q ?? q).trim();
    const ncity = next.city ?? city;
    const nservice = next.service ?? service;
    if (nq) params.set("q", nq);
    if (ncity) params.set("city", ncity);
    if (nservice) params.set("service", nservice);
    router.push(`/rentgen-merkezleri${params.toString() ? `?${params}` : ""}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    go({});
  }

  const noMatches = labels.noMatches ?? "Uyğun variant tapılmadı";

  return (
    <form
      onSubmit={submit}
      className={
        variant === "hero"
          ? "glass rounded-3xl p-3 shadow-[var(--shadow-glow)] sm:p-4"
          : "rounded-3xl bg-[#e4e4eb] p-4 sm:p-5" // 2026-08-16: həkimlər panel forması
      }
    >
      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_auto]">
        <Labeled icon={<Stethoscope className="h-4 w-4" />} label={labels.service}>
          <SmartCombo
            options={services}
            value={service}
            allLabel={labels.allServices}
            noMatches={noMatches}
            ariaLabel={labels.service}
            onChange={(v) => {
              setService(v);
              if (autoFilter) go({ service: v });
            }}
          />
        </Labeled>

        <Labeled icon={<MapPin className="h-4 w-4" />} label={labels.city}>
          <SmartCombo
            options={cities}
            value={city}
            allLabel={labels.allCities}
            noMatches={noMatches}
            ariaLabel={labels.city}
            onChange={(v) => {
              setCity(v);
              if (autoFilter) go({ city: v });
            }}
          />
        </Labeled>

        <Labeled icon={<Search className="h-4 w-4" />} label={labels.centerName}>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.centerNamePlaceholder}
            aria-label={labels.centerName}
          />
        </Labeled>

        <div className="flex items-end">
          <Button type="submit" size="lg" className="h-11 w-full md:w-auto">
            <Search className="h-4 w-4" />
            {labels.search}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Labeled({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-500">
        <span className="text-brand-500">{icon}</span>
        {label}
      </span>
      {children}
    </div>
  );
}
