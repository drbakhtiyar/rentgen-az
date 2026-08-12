"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ServiceIcon } from "@/components/ui/service-icon";

export type ExplorerService = {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  iconUrl: string | null;
  /** Premium böyük ikon (Blob) — varsa kart vizual tile ilə göstərilir. */
  bigIcon?: string | null;
  category: string | null;
  count: number;
  priceMin: number | null;
  priceMax: number | null;
};

/** Approximate price: single value if min===max, otherwise a "min–max" range. */
function priceLabel(min: number | null, max: number | null): string | null {
  if (min == null) return null;
  const hi = max ?? min;
  return hi > min ? `${min}–${hi} ₼` : `${min} ₼`;
}

/* Impilo redizaynı (2026-08-13): böyük anatomik ikon-tile-lı kartlar,
 * qısa mətn (təsvir yığışdırıldı — ad + qiymət + mərkəz sayı bəsdir),
 * bənövşəyi aksentlər, hover-də ambient kölgə. Premium ikonu olmayan
 * xidmətlər yığcam sətir-kart alır. */
export function ServicesExplorer({
  services,
  categories,
  categoryLabels,
  labels,
}: {
  services: ExplorerService[];
  categories: string[];
  /** AZ category (filter key) → display label (RU when applicable). */
  categoryLabels?: Record<string, string>;
  labels: { all: string; centerWord: string; more: string };
}) {
  const [active, setActive] = React.useState<string | null>(null);
  const shown = active ? services.filter((s) => s.category === active) : services;
  const catLabel = (c: string) => categoryLabels?.[c] ?? c;

  const chip = (key: string, label: string, isActive: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition-all ${
        isActive
          ? "bg-iris-pulse text-white ring-iris-pulse shadow-[0_0_16px_rgba(60,57,185,0.35)]"
          : "bg-white text-slate-600 ring-ash-2 hover:ring-iris-veil/50 hover:text-iris-pulse"
      }`}
    >
      {label}
    </button>
  );

  // Premium ikonlu kartlar önə (vizual vitrin), qalanlar arxada — hər iki
  // qrup öz daxilində mövcud sıralamanı saxlayır.
  const withIcon = shown.filter((s) => s.bigIcon);
  const withoutIcon = shown.filter((s) => !s.bigIcon);

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {chip("__all__", labels.all, active === null, () => setActive(null))}
          {categories.map((c) => chip(c, catLabel(c), active === c, () => setActive(c)))}
        </div>
      )}

      {/* Premium ikonlu xidmətlər — böyük vizual kartlar */}
      {withIcon.length > 0 && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {withIcon.map((s) => (
            <Link key={s.slug} href={`/xidmetler/${s.slug}`}>
              <div className="group h-full overflow-hidden rounded-3xl bg-white ring-1 ring-ash-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-24px_rgba(64,60,213,0.4)] hover:ring-iris-veil/60">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0d1330]">
                  <Image
                    src={s.bigIcon!}
                    alt={s.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  {s.count > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-mint-vital ring-1 ring-mint-vital/40 backdrop-blur-sm">
                      {s.count} {labels.centerWord}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h3 className="font-display truncate text-base font-semibold tracking-tight text-iris-canvas">
                      {s.name}
                    </h3>
                    {priceLabel(s.priceMin, s.priceMax) && (
                      <p className="mt-0.5 text-sm font-semibold text-iris-pulse">
                        ~ {priceLabel(s.priceMin, s.priceMax)}
                      </p>
                    )}
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ash-2 text-iris-canvas transition-all duration-300 group-hover:border-iris-veil group-hover:bg-iris-glow/10 group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Qalan xidmətlər — yığcam kartlar (təsvirsiz) */}
      {withoutIcon.length > 0 && (
        <div className={`${withIcon.length > 0 ? "mt-5" : "mt-6"} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
          {withoutIcon.map((s) => (
            <Link key={s.slug} href={`/xidmetler/${s.slug}`}>
              <div className="group flex h-full items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-ash-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_-24px_rgba(64,60,213,0.35)] hover:ring-iris-veil/50">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-iris-glow/10 text-iris-pulse ring-1 ring-iris-veil/25 transition-colors group-hover:bg-iris-pulse group-hover:text-white">
                  <ServiceIcon name={s.icon} url={s.iconUrl} className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display truncate text-[15px] font-semibold tracking-tight text-iris-canvas">
                    {s.name}
                  </h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                    {priceLabel(s.priceMin, s.priceMax) && (
                      <span className="font-semibold text-iris-pulse">
                        ~ {priceLabel(s.priceMin, s.priceMax)}
                      </span>
                    )}
                    {s.count > 0 && (
                      <span className="text-slate-500">
                        {s.count} {labels.centerWord}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-fog-2 transition-all group-hover:translate-x-0.5 group-hover:text-iris-pulse" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
