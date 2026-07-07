import type { Metadata } from "next";
import Link from "next/link";
import { Star, ShieldAlert, Stethoscope } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/reviews/stars";
import { ScoreBreakdown } from "@/components/reviews/score-breakdown";
import { ReviewHideToggle, ReviewModerationButtons } from "@/components/admin/review-controls";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, doctorName } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Rəylər",
  path: "/admin/reyler",
  noIndex: true,
});

const reviewInclude = {
  center: { select: { name: true, slug: true } },
  patient: { select: { firstName: true, lastName: true } },
} as const;

export default async function AdminReviewsPage() {
  const admin = await requireRole("ADMIN", "/admin/reyler");

  const [flagged, reviews] = await Promise.all([
    prisma.review
      .findMany({ where: { flagged: true }, include: reviewInclude, orderBy: { createdAt: "desc" } })
      .catch(() => []),
    prisma.review
      .findMany({ where: { flagged: false }, include: reviewInclude, orderBy: { createdAt: "desc" }, take: 200 })
      .catch(() => []),
  ]);

  // Resolve referring-doctor names (admin-only info).
  const docIds = [...new Set([...flagged, ...reviews].map((r) => r.doctorId).filter(Boolean))] as string[];
  const docs = docIds.length
    ? await prisma.doctorProfile
        .findMany({ where: { id: { in: docIds } }, select: { id: true, firstName: true, lastName: true } })
        .catch(() => [])
    : [];
  const docName = new Map(
    docs.map((d) => [d.id, doctorName(d.firstName, d.lastName)]),
  );
  const referrer = (r: { doctorName: string | null; doctorId: string | null }) =>
    r.doctorName || (r.doctorId ? docName.get(r.doctorId) ?? null : null);

  const nameOf = (p: { firstName: string | null; lastName: string | null }) =>
    `${p.firstName ?? ""} ${p.lastName ? p.lastName[0] + "." : ""}`.trim() || "Pasiyent";

  return (
    <AdminShell title="Rəylər" userName={admin.phone}>
      {flagged.length > 0 && (
        <div className="mb-5">
          <Panel
            title={
              <span className="flex items-center gap-2 text-amber-700">
                <ShieldAlert className="h-4 w-4" /> Moderasiya gözləyən ({flagged.length})
              </span>
            }
          >
            <div className="space-y-3">
              {flagged.map((r) => (
                <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} size="sm" />
                    {r.center && <span className="font-semibold text-ink-900">{r.center.name}</span>}
                    <span className="text-sm text-slate-500">{nameOf(r.patient)}</span>
                  </div>
                  <ScoreBreakdown review={r} />
                  {r.comment && (
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-700">
                      {r.comment}
                    </p>
                  )}
                  {referrer(r) && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Stethoscope className="h-3.5 w-3.5" /> Göndərən: {referrer(r)}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
                    <ReviewModerationButtons reviewId={r.id} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <Panel title={`Rəylər (${reviews.length})`}>
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} size="sm" />
                    {r.center && (
                      <Link
                        href={`/rentgen-merkezleri/${r.center.slug}`}
                        className="font-semibold text-ink-900 hover:text-brand-600"
                      >
                        {r.center.name}
                      </Link>
                    )}
                    <span className="text-sm text-slate-500">{nameOf(r.patient)}</span>
                    {r.verified && <Badge tone="green">Təsdiqlənmiş</Badge>}
                    {r.source === "qr" && <Badge tone="cyan">QR</Badge>}
                    {r.hidden && <Badge tone="slate">Gizli</Badge>}
                  </div>
                  <ScoreBreakdown review={r} />
                  {r.comment && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {r.comment}
                    </p>
                  )}
                  {referrer(r) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Stethoscope className="h-3.5 w-3.5" /> Göndərən: {referrer(r)}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">{formatDateAz(r.createdAt)}</p>
                </div>
                <ReviewHideToggle reviewId={r.id} hidden={r.hidden} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Star />} title="Hələ rəy yoxdur" />
        )}
      </Panel>
    </AdminShell>
  );
}
