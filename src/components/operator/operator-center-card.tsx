import Link from "next/link";
import { MapPin, Clock, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/widgets";
import { RatingSummary } from "@/components/reviews/stars";

type OperatorCenter = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string;
  landlinePhone: string | null;
  logoUrl: string | null;
  images: string[];
  workingHours: string | null;
  status: "PENDING" | "APPROVED" | "DEACTIVATED";
  services: { id: string; service: { name: string; shortName: string | null } }[];
};

const COMPLETENESS_TONE = [
  "bg-rose-50 text-rose-600 ring-rose-200",
  "bg-rose-50 text-rose-600 ring-rose-200",
  "bg-amber-50 text-amber-700 ring-amber-200",
  "bg-amber-50 text-amber-700 ring-amber-200",
  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "bg-emerald-50 text-emerald-700 ring-emerald-200",
];

/** Operator-side center card: same rich visuals as the admin card, but the ONLY
 *  action is "Redaktə" — no approve / deactivate / block / delete controls. */
export function OperatorCenterCard({
  center,
  rating,
  serviceCount,
  completeness,
}: {
  center: OperatorCenter;
  rating?: { avg: number; count: number };
  serviceCount?: number;
  completeness?: number;
}) {
  const services = center.services.slice(0, 4);
  const extra = (serviceCount ?? center.services.length) - services.length;

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/panel/${center.id}`} className="group flex flex-1 flex-col">
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-ink-900 to-brand-800">
          <div className="absolute inset-0 bg-grid-dark opacity-50" />
          {center.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={center.images[0]} alt={center.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          ) : center.logoUrl ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-white to-surface" />
              <div className="absolute inset-0 bg-grid opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <span className="inline-flex max-w-[70%] overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={center.logoUrl} alt={`${center.name} loqosu`} className="block h-auto max-h-20 w-auto max-w-full object-contain" loading="lazy" />
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-white/90">{center.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <StatusBadge status={center.status} />
            {typeof completeness === "number" && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ring-1 ring-inset ${COMPLETENESS_TONE[completeness] ?? COMPLETENESS_TONE[0]}`}
                title="Məlumat dolğunluğu (telefon · şəkil · reytinq · saat · ünvan)"
              >
                {completeness}/5
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-base font-bold text-ink-900 transition-colors group-hover:text-brand-700">
            {center.name}
          </h3>

          {rating && rating.count > 0 && (
            <div className="mt-1.5">
              <RatingSummary avg={rating.avg} count={rating.count} size="sm" />
            </div>
          )}

          <div className="mt-2 space-y-1 text-sm text-slate-600">
            {(center.city || center.address) && (
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <span className="line-clamp-1">{[center.city, center.address].filter(Boolean).join(", ")}</span>
              </p>
            )}
            <p className="flex items-center gap-1.5">
              <span className="text-slate-400">☎</span>
              {center.phone && center.phone.trim() !== "" ? (
                <span>{center.phone}</span>
              ) : (
                <span className="text-slate-400 italic">nömrə yox</span>
              )}
            </p>
            {center.landlinePhone && (
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>🏢</span>
                <span>{center.landlinePhone} <span className="italic">(şəhər)</span></span>
              </p>
            )}
            {center.workingHours && (
              <p className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0 text-brand-500" />
                <span className="line-clamp-1">{center.workingHours}</span>
              </p>
            )}
          </div>

          {services.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {services.map((cs) => (
                <Badge key={cs.id} tone="cyan">{cs.service.shortName ?? cs.service.name}</Badge>
              ))}
              {extra > 0 && <Badge tone="slate">+{extra}</Badge>}
            </div>
          )}
        </div>
      </Link>

      {/* Sole action for the operator: edit */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
        <Link
          href={`/panel/${center.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Pencil className="h-3.5 w-3.5" /> Redaktə et
        </Link>
      </div>
    </Card>
  );
}
