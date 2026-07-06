import Link from "next/link";
import { MapPin, Clock, ArrowUpRight, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VerifiedBadge, Badge } from "@/components/ui/badge";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { RatingSummary } from "@/components/reviews/stars";
import { OpenStatus } from "@/components/centers/open-status";
import { formatPrice } from "@/lib/utils";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import type { CenterWithServices } from "@/lib/queries";

export function CenterCard({
  center,
  rating,
  highlightService,
  locale = DEFAULT_LOCALE,
}: {
  center: CenterWithServices;
  rating?: { avg: number; count: number };
  /** service slug the patient searched for — its price is featured */
  highlightService?: string;
  locale?: Locale;
}) {
  const matched = highlightService
    ? center.services.find((cs) => cs.service.slug === highlightService)
    : undefined;
  // When a service is searched, show the other services after the matched one.
  const rest = matched
    ? center.services.filter((cs) => cs.id !== matched.id)
    : center.services;
  const services = rest.slice(0, matched ? 2 : 3);
  const extra = rest.length - services.length;

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-ink-900 to-brand-800">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="glow absolute -right-10 -top-10 h-40 w-40 opacity-60" />
        {center.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={center.images[0]}
            alt={`${center.name} — rentgen mərkəzi`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : center.logoUrl ? (
          <>
            {/* Light, directory-style surface: any logo reads as a clean brand
                mark instead of a patch floating on the dark gradient. */}
            <div className="absolute inset-0 bg-gradient-to-b from-white to-surface" />
            <div className="absolute inset-0 bg-grid opacity-70" />
            <div className="glow absolute -right-12 -top-12 h-44 w-44 opacity-25" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200/70" />
            <div className="absolute inset-0 flex items-center justify-center p-5">
              {/* Tight-hugging, corner-clipped tile: a solid square logo becomes a
                  rounded app-icon; a transparent PNG or wordmark becomes a clean
                  rounded logo card — consistent framing for ANY uploaded image. */}
              <span className="inline-flex max-w-[78%] overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-[0_10px_30px_-12px_rgba(16,31,70,0.28)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={center.logoUrl}
                  alt={`${center.name} loqosu`}
                  className="block h-auto max-h-24 w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-2xl font-bold text-white/90">
              {center.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <VerifiedBadge className="bg-white/95 text-brand-700 shadow-sm ring-slate-200/80 backdrop-blur" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/rentgen-merkezleri/${center.slug}`} className="group/link">
          <h3 className="font-display text-lg font-bold text-ink-900 transition-colors group-hover/link:text-brand-700">
            {center.name}
          </h3>
        </Link>

        {rating && (
          <div className="mt-2">
            <RatingSummary avg={rating.avg} count={rating.count} size="sm" />
          </div>
        )}

        <div className="mt-2 space-y-1.5 text-sm text-slate-600">
          {(center.city || center.address) && (
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>{[center.city, center.address].filter(Boolean).join(", ")}</span>
            </p>
          )}
          {center.workingHours && (
            <p className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0 text-brand-500" />
              <span>{center.workingHours}</span>
            </p>
          )}
        </div>

        {center.hours ? (
          <div className="mt-2.5">
            <OpenStatus hours={center.hours} locale={locale} />
          </div>
        ) : null}

        {matched && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-800">
              <Tag className="h-4 w-4 text-brand-500" />
              {matched.service.shortName ?? matched.service.name}
            </span>
            <span className="text-sm font-bold text-ink-900">
              {formatPrice(matched.price, matched.priceTo)}
            </span>
          </div>
        )}

        {services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {services.map((cs) => (
              <Badge key={cs.id} tone="cyan">
                {cs.service.shortName ?? cs.service.name}
              </Badge>
            ))}
            {extra > 0 && <Badge tone="slate">+{extra}</Badge>}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <CallButton phone={center.phone} centerId={center.id} className="h-10 flex-1 px-3 text-xs" />
          {center.whatsapp && (
            <WhatsAppButton
              phone={center.whatsapp}
              centerId={center.id}
              className="h-10 flex-1 px-3 text-xs"
            />
          )}
          <Link
            href={`/rentgen-merkezleri/${center.slug}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
            aria-label="Ətraflı"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
