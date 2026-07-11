"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceIcon } from "@/components/ui/service-icon";

export type ExplorerService = {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  iconUrl: string | null;
  category: string | null;
  count: number;
};

export function ServicesExplorer({
  services,
  categories,
  labels,
}: {
  services: ExplorerService[];
  categories: string[];
  labels: { all: string; centerWord: string; more: string };
}) {
  const [active, setActive] = React.useState<string | null>(null);
  const shown = active ? services.filter((s) => s.category === active) : services;

  const chip = (key: string, label: string, isActive: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors ${
        isActive
          ? "bg-brand-600 text-white ring-brand-600"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {chip("__all__", labels.all, active === null, () => setActive(null))}
          {categories.map((c) => chip(c, c, active === c, () => setActive(c)))}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s) => (
          <Link key={s.slug} href={`/xidmetler/${s.slug}`}>
            <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-glow)]">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <ServiceIcon name={s.icon} url={s.iconUrl} className="h-6 w-6" />
                </div>
                {s.count > 0 ? (
                  <Badge tone="cyan">
                    {s.count} {labels.centerWord}
                  </Badge>
                ) : null}
              </div>
              <h3 className="font-display mt-4 text-lg font-bold text-ink-900">{s.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                {labels.more} <ArrowRight className="h-4 w-4" />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
