import Link from "next/link";
import { MapPin, Clock, Pencil, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/widgets";
import { RatingSummary } from "@/components/reviews/stars";
import { CenterStatusControls, BlockToggle } from "@/components/admin/controls";
import { PLAN_LABEL } from "@/lib/plans";
import type { CenterStatus } from "@/generated/prisma/enums";
import type { Plan } from "@/generated/prisma/client";

type AdminCenter = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string;
  logoUrl: string | null;
  images: string[];
  workingHours: string | null;
  status: CenterStatus;
  plan: Plan;
  user: { id: string; isBlocked: boolean };
  services: { id: string; service: { name: string; shortName: string | null } }[];
};

const PLAN_TONE: Record<Plan, string> = {
  FREE: "bg-slate-100 text-slate-600 ring-slate-200",
  SILVER: "bg-slate-200 text-slate-700 ring-slate-300",
  GOLD: "bg-amber-50 text-amber-700 ring-amber-200",
  PLATINUM: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

/** Admin-side center card: same visual language as the public site card,
 *  but with the real status and admin controls (edit / activate / block). */
export function AdminCenterCard({
  center,
  rating,
}: {
  center: AdminCenter;
  rating?: { avg: number; count: number };
}) {
  const services = center.services.slice(0, 4);
  const extra = center.services.length - services.length;

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Header (image / logo / initial) — mirrors the public card */}
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
        <div className="absolute left-3 top-3">
          <StatusBadge status={center.status} />
        </div>
        <div className="absolute right-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm ring-1 ring-inset ${PLAN_TONE[center.plan]}`}
          >
            {PLAN_LABEL[center.plan]}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/admin/merkezler/${center.id}`} className="group/link">
          <h3 className="font-display text-base font-bold text-ink-900 transition-colors group-hover/link:text-brand-700">
            {center.name}
          </h3>
        </Link>

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
            <a href={`tel:${center.phone}`} className="hover:text-brand-600">{center.phone}</a>
          </p>
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

        {/* Admin controls */}
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <Link
            href={`/admin/merkezler/${center.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" /> Redaktə
          </Link>
          {center.status === "APPROVED" && (
            <Link
              href={`/rentgen-merkezleri/${center.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              <Eye className="h-3.5 w-3.5" /> Bax
            </Link>
          )}
          <CenterStatusControls centerId={center.id} status={center.status} />
          <BlockToggle userId={center.user.id} blocked={center.user.isBlocked} />
        </div>
      </div>
    </Card>
  );
}
