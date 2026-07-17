import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { brandedQrDataUrl } from "@/lib/qr";
import { Star, Download, QrCode } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Stars } from "@/components/reviews/stars";
import { ScoreBreakdown } from "@/components/reviews/score-breakdown";
import { ReviewReplyForm } from "@/components/reviews/review-reply-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { SITE_URL } from "@/lib/env";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
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
    select: { id: true, name: true, slug: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const reviews = await prisma.review.findMany({
    where: { centerId: center.id, hidden: false },
    orderBy: { createdAt: "desc" },
    include: { patient: { select: { firstName: true, lastName: true } } },
  });

  const reviewUrl = `${SITE_URL}/rey/${center.slug}`;
  const qrDataUrl = await brandedQrDataUrl(reviewUrl);
  const pd = getPanelDict(await getLocale());

  return (
    <DashboardShell title={pd.nav.reyler} roleLabel={pd.center.roleLabel} userName={center.name} nav={centerNav}>
      <div className="mb-5">
        <Panel title={pd.center.qrTitle}>
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Rəy QR kodu"
              className="h-40 w-40 shrink-0 rounded-xl ring-1 ring-slate-200"
            />
            <div className="min-w-0 flex-1 text-sm text-slate-600">
              <p className="flex items-center gap-1.5 font-semibold text-ink-900">
                <QrCode className="h-4 w-4 text-brand-600" /> {pd.center.qrHow}
              </p>
              <p className="mt-2">{pd.center.qrHowBody}</p>
              <p className="mt-2 break-all text-xs text-slate-400">{reviewUrl}</p>
              <a
                href={qrDataUrl}
                download={`rentgen-qr-${center.slug}.png`}
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Download className="h-4 w-4" /> {pd.center.qrDownload}
              </a>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title={`${pd.center.reviewsTitle} (${reviews.length})`}>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => {
              const patientName =
                [r.patient?.firstName, r.patient?.lastName].filter(Boolean).join(" ") ||
                pd.shell.rolePatient;
              return (
                <div key={r.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-ink-900">{patientName}</span>
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} size="sm" />
                      <span className="text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
                    </div>
                  </div>
                  <ScoreBreakdown review={r} />
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
            title={pd.center.revEmptyTitle}
            description={pd.center.revEmptyBody}
          />
        )}
      </Panel>
    </DashboardShell>
  );
}
