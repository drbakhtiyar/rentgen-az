import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, ArrowUpRight, Tag, Star } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/badge";
import { serviceNameRu } from "@/content/services-ru";
import { formatHoursSummary, type WeeklyHours } from "@/lib/hours";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { RatingSummary } from "@/components/reviews/stars";
import { GoogleRatingBadge } from "@/components/reviews/google-rating-badge";
import { OpenStatus } from "@/components/centers/open-status";
import { formatPrice } from "@/lib/utils";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { isCenterFeatured } from "@/lib/plans";
import type { CenterWithServices } from "@/lib/queries";

/* Impilo üslubu (2026-08-12): ağ kart 24px radius, ambient bənövşəyi hover
 * kölgəsi, Iris Pulse aksentlər, pill taqlar. Dinamika: kart qalxır, foto
 * yaxınlaşır, ox düyməsi sürüşür. */
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
  const d = getDict(locale);
  const cta = d.cta;
  const featured = isCenterFeatured(center.plan);
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
    <div className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ash-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-24px_rgba(64,60,213,0.35)] hover:ring-iris-veil/60">
      <div className="relative h-40 overflow-hidden bg-observatory">
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        {center.images?.[0] ? (
          <Image
            src={center.images[0]}
            alt={`${center.name} — ${center.city ?? "Bakı"} dental rentgen mərkəzi`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : center.logoUrl ? (
          <>
            {/* Light, directory-style surface: any logo reads as a clean brand
                mark instead of a patch floating on the dark gradient. */}
            <div className="absolute inset-0 bg-gradient-to-b from-white to-pearl" />
            <div className="absolute inset-0 bg-grid opacity-60" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-ash-2/70" />
            <div className="absolute inset-0 flex items-center justify-center p-5">
              {/* Tight-hugging, corner-clipped tile: a solid square logo becomes a
                  rounded app-icon; a transparent PNG or wordmark becomes a clean
                  rounded logo card — consistent framing for ANY uploaded image. */}
              <span className="inline-flex max-w-[78%] overflow-hidden rounded-2xl bg-white ring-1 ring-ash-2 shadow-[0_10px_30px_-12px_rgba(22,22,92,0.25)] transition-transform duration-500 group-hover:scale-105">
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
            <span className="font-display text-2xl font-semibold text-white/90">
              {center.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <VerifiedBadge label={locale === "ru" ? "Проверен" : undefined} className="bg-white/95 text-iris-pulse shadow-sm ring-ash-2 backdrop-blur" />
        </div>
        {featured && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-iris-pulse px-2.5 py-1 text-xs font-medium text-white shadow-[0_0_20px_rgba(60,57,185,0.5)] backdrop-blur">
              <Star className="h-3 w-3 fill-white text-white" />
              {d.centers.featuredBadge}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/rentgen-merkezleri/${center.slug}`} className="group/link min-w-0">
            <h3 className="font-display text-lg font-semibold tracking-tight text-iris-canvas transition-colors group-hover/link:text-iris-pulse">
              {center.name}
            </h3>
          </Link>
          {/* Show the logo next to the name on every center (cover or not). */}
          {center.logoUrl && (
            <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-ash-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={center.logoUrl}
                alt={`${center.name} loqosu`}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </span>
          )}
        </div>

        {(rating || typeof center.googleRating === "number") && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {rating && <RatingSummary avg={rating.avg} count={rating.count} size="sm" />}
            {typeof center.googleRating === "number" && (
              <GoogleRatingBadge
                placeId={center.googlePlaceId}
                rating={center.googleRating}
                reviewCount={center.googleReviewCount}
                className="border border-ash-2 !bg-white px-2.5 py-0.5 text-xs !shadow-none !ring-0"
              />
            )}
          </div>
        )}

        <div className="mt-2 space-y-1.5 text-sm text-slate-600">
          {(center.city || center.address) && (
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-iris-pulse" />
              <span>{[center.city, center.address].filter(Boolean).join(", ")}</span>
            </p>
          )}
          {(center.workingHours || center.hours) && (
            <p className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0 text-iris-pulse" />
              {/* RU: strukturlu saatlardan rus qısaltmalı xülasə (2026-08-16) */}
              <span>
                {locale === "ru" && center.hours
                  ? formatHoursSummary(center.hours as unknown as WeeklyHours, "ru")
                  : center.workingHours}
              </span>
            </p>
          )}
        </div>

        {center.hours ? (
          <div className="mt-2.5">
            <OpenStatus hours={center.hours} locale={locale} />
          </div>
        ) : null}

        {matched && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-iris-veil/25 bg-iris-glow/8 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-iris-glow">
              <Tag className="h-4 w-4 text-iris-pulse" />
              {locale === "ru" ? serviceNameRu(matched.service.name) : (matched.service.shortName ?? matched.service.name)}
            </span>
            <span className="text-sm font-semibold text-iris-canvas">
              {formatPrice(matched.price, matched.priceTo)}
            </span>
          </div>
        )}

        {services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {services.map((cs) => (
              <span
                key={cs.id}
                className="inline-flex items-center rounded-full border border-iris-veil/30 bg-iris-glow/8 px-2.5 py-0.5 text-xs font-medium text-iris-glow transition-colors group-hover:border-iris-veil/50"
              >
                {locale === "ru" ? serviceNameRu(cs.service.name) : (cs.service.shortName ?? cs.service.name)}
              </span>
            ))}
            {extra > 0 && (
              <span className="inline-flex items-center rounded-full bg-pearl px-2.5 py-0.5 text-xs font-medium text-fog-2">
                +{extra}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <CallButton
            phone={center.phone}
            centerId={center.id}
            locale={locale}
            className="h-10 flex-1 bg-iris-pulse px-3 text-xs hover:bg-iris-glow"
          />
          {center.whatsapp && (
            <WhatsAppButton
              phone={center.whatsapp}
              centerId={center.id}
              className="h-10 flex-1 px-3 text-xs"
            />
          )}
          <Link
            href={`/rentgen-merkezleri/${center.slug}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ash-2 text-iris-canvas transition-all duration-300 hover:border-iris-veil hover:bg-iris-glow/10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-label={cta.details}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
