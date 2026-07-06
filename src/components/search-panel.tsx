"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Stethoscope } from "lucide-react";
import { Select, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Option = { value: string; label: string };

export type SearchLabels = {
  service: string;
  allServices: string;
  city: string;
  allCities: string;
  centerName: string;
  centerNamePlaceholder: string;
  search: string;
};

const AZ_LABELS: SearchLabels = {
  service: "Xidmət",
  allServices: "Bütün xidmətlər",
  city: "Rayon / şəhər",
  allCities: "Bütün rayonlar",
  centerName: "Mərkəz adı",
  centerNamePlaceholder: "Mərkəzin adı",
  search: "Axtar",
};

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city) params.set("city", city);
    if (service) params.set("service", service);
    router.push(`/rentgen-merkezleri${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className={
        variant === "hero"
          ? "glass rounded-3xl p-3 shadow-[var(--shadow-glow)] sm:p-4"
          : "rounded-2xl border border-slate-200 bg-white p-3 shadow-[var(--shadow-soft)]"
      }
    >
      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_auto]">
        <Labeled icon={<Stethoscope className="h-4 w-4" />} label={labels.service}>
          <Select value={service} onChange={(e) => setService(e.target.value)} aria-label={labels.service}>
            <option value="">{labels.allServices}</option>
            {services.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Labeled>

        <Labeled icon={<MapPin className="h-4 w-4" />} label={labels.city}>
          <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label={labels.city}>
            <option value="">{labels.allCities}</option>
            {cities.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
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
