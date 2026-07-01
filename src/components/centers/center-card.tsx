import Link from "next/link";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VerifiedBadge, Badge } from "@/components/ui/badge";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { RatingSummary } from "@/components/reviews/stars";
import type { CenterWithServices } from "@/lib/queries";

export function CenterCard({
  center,
  rating,
}: {
  center: CenterWithServices;
  rating?: { avg: number; count: number };
}) {
  const services = center.services.slice(0, 3);
  const extra = center.services.length - services.length;

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
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-2xl font-bold text-white/90">
              {center.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <VerifiedBadge />
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
          <CallButton phone={center.phone} className="h-10 flex-1 px-3 text-xs" />
          {center.whatsapp && (
            <WhatsAppButton
              phone={center.whatsapp}
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
