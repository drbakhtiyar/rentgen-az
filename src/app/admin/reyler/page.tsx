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

const PER_PAGE = 30;

const reviewInclude = {
  center: { select: { name: true, slug: true } },
  patient: { select: { firstName: true, lastName: true } },
} as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/reyler");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [flagged, reviews, total] = await Promise.all([
    prisma.review
      .findMany({ where: { flagged: true }, include: reviewInclude, orderBy: { createdAt: "desc" } })
      .catch(() => []),
    prisma.review
      .findMany({
        where: { flagged: false },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      })
      .catch(() => []),
    prisma.review.count({ where: { flagged: false } }).catch(() => 0),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const pageUrl = (p: number) => (p > 1 ? `/admin/reyler?page=${p}` : "/admin/reyler");

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
            <div className="grid gap-3 lg:grid-cols-2">
              {flagged.map((r) => (
                <div key={r.id} className="flex flex-col rounded-xl border border-amber-200 bg-amber-50/40 p-4">
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
                  <div className="mt-3 flex items-center justify-between border-t border-amber-100 pt-3">
                    <span className="text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
                    <ReviewModerationButtons reviewId={r.id} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <Panel title={`Rəylər (${total})`}>
        {reviews.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="flex flex-col rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.center && (
                        <Link
                          href={`/rentgen-merkezleri/${r.center.slug}`}
                          className="truncate font-semibold text-ink-900 hover:text-brand-600"
                        >
                          {r.center.name}
                        </Link>
                      )}
                      {r.verified && <Badge tone="green">Təsdiqlənmiş</Badge>}
                      {r.source === "qr" && <Badge tone="cyan">QR</Badge>}
                      {r.hidden && <Badge tone="slate">Gizli</Badge>}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={r.rating} size="sm" />
                      <span className="text-sm text-slate-500">{nameOf(r.patient)}</span>
                    </div>
                  </div>
                  <ReviewHideToggle reviewId={r.id} hidden={r.hidden} />
                </div>

                <ScoreBreakdown review={r} />
                {r.comment && (
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {r.comment}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  {referrer(r) && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" /> Göndərən: {referrer(r)}
                    </span>
                  )}
                  <span>{formatDateAz(r.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Star />} title="Hələ rəy yoxdur" />
        )}

        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">
              Səhifə {page} / {pageCount} · {total} rəy
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <a href={pageUrl(page - 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                  ← Əvvəlki
                </a>
              ) : (
                <span className="cursor-not-allowed rounded-lg bg-slate-50 px-3 py-1.5 text-slate-300">← Əvvəlki</span>
              )}
              {page < pageCount ? (
                <a href={pageUrl(page + 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                  Növbəti →
                </a>
              ) : (
                <span className="cursor-not-allowed rounded-lg bg-slate-50 px-3 py-1.5 text-slate-300">Növbəti →</span>
              )}
            </div>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
