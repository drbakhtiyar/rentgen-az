import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/reviews/stars";
import { ReviewHideToggle } from "@/components/admin/review-controls";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Rəylər",
  path: "/admin/reyler",
  noIndex: true,
});

export default async function AdminReviewsPage() {
  const admin = await requireRole("ADMIN", "/admin/reyler");

  const reviews = await prisma.review
    .findMany({
      include: {
        center: { select: { name: true, slug: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    .catch(() => []);

  return (
    <AdminShell title="Rəylər" userName={admin.phone}>
      <Panel title={`Rəylər (${reviews.length})`}>
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => {
              const displayName =
                `${r.patient.firstName} ${
                  r.patient.lastName ? r.patient.lastName[0] + "." : ""
                }`.trim() || "Pasiyent";
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div className="min-w-0">
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
                      <span className="text-sm text-slate-500">{displayName}</span>
                      {r.verified && <Badge tone="green">Təsdiqlənmiş</Badge>}
                      {r.hidden && <Badge tone="slate">Gizli</Badge>}
                    </div>
                    {r.comment && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                        {r.comment}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateAz(r.createdAt)}
                    </p>
                  </div>
                  <ReviewHideToggle reviewId={r.id} hidden={r.hidden} />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={<Star />} title="Hələ rəy yoxdur" />
        )}
      </Panel>
    </AdminShell>
  );
}
