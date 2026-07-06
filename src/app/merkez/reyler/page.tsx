import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Star } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Stars } from "@/components/reviews/stars";
import { ReviewReplyForm } from "@/components/reviews/review-reply-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Rəylər",
  path: "/merkez/reyler",
  noIndex: true,
});

export default async function CenterReviewsPage() {
  const user = await requireRole("CENTER", "/merkez/reyler");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const reviews = await prisma.review.findMany({
    where: { centerId: center.id, hidden: false },
    orderBy: { createdAt: "desc" },
    include: { patient: { select: { firstName: true, lastName: true } } },
  });

  return (
    <DashboardShell title="Rəylər" roleLabel="Rentgen mərkəzi" userName={center.name} nav={centerNav}>
      <Panel title={`Pasiyent rəyləri (${reviews.length})`}>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => {
              const patientName =
                [r.patient?.firstName, r.patient?.lastName].filter(Boolean).join(" ") ||
                "Pasiyent";
              return (
                <div key={r.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-ink-900">{patientName}</span>
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} size="sm" />
                      <span className="text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  )}
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ReviewReplyForm reviewId={r.id} defaultReply={r.reply} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Star />}
            title="Hələ rəy yoxdur"
            description="Xidmət aldığını təsdiqləyən pasiyentlər rəy yaza bilər."
          />
        )}
      </Panel>
    </DashboardShell>
  );
}
