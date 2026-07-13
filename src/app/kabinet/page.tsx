import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Heart, User, ArrowRight, Search, Download } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { patientNav } from "@/components/dashboard/role-navs";
import { StatCard, EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { ButtonLink } from "@/components/ui/button";
import { CancelRequestButton } from "@/components/reviews/cancel-request-button";
import { EditTimeButton } from "@/components/reviews/edit-time-button";
import { RentgenDownloadList } from "@/components/rentgen/rentgen-download-list";
import { ReviewForm } from "@/components/reviews/review-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getReviewableCentersForPatient } from "@/lib/queries";
import { parseHours } from "@/lib/hours";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDateAz, formatDateTimeAz } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pasiyent kabineti",
  path: "/kabinet",
  noIndex: true,
});

export default async function PatientDashboardPage() {
  const user = await requireRole("PATIENT", "/kabinet");
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: user.id },
    include: {
      _count: { select: { favoriteCenters: true, appointmentRequests: true } },
    },
  });

  const requests = await prisma.appointmentRequest.findMany({
    where: { patientId: profile?.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      center: { select: { name: true, slug: true, hours: true } },
      files: {
        where: { deletedAt: null },
        select: { id: true, fileName: true, size: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const reviewable = profile
    ? await getReviewableCentersForPatient(profile.id)
    : [];

  const pd = getPanelDict(await getLocale());
  const t = pd.patient;
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || pd.shell.rolePatient;
  const profileIncomplete = !profile?.firstName || !profile?.lastName;

  return (
    <DashboardShell title={`${t.greeting}, ${name}`} roleLabel={pd.shell.rolePatient} userName={name} nav={patientNav}>
      {profileIncomplete && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-brand-600" />
            <p className="text-sm text-brand-900">{t.profileIncomplete}</p>
          </div>
          <ButtonLink href="/kabinet/profil" size="sm" className="shrink-0">
            {t.complete}
          </ButtonLink>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.statRequests} value={profile?._count.appointmentRequests ?? 0} icon={<Inbox />} />
        <StatCard label={t.favoritesTitle} value={profile?._count.favoriteCenters ?? 0} icon={<Heart />} tone="cyan" />
        <StatCard label={t.statPhone} value={<span className="text-base">{formatPhoneDisplay(user.phone)}</span>} icon={<User />} tone="slate" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title={t.historyTitle}>
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-100 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">
                          {r.center ? (
                            <Link href={`/rentgen-merkezleri/${r.center.slug}`} className="hover:text-brand-600">
                              {r.center.name}
                            </Link>
                          ) : (
                            t.generalRequest
                          )}
                        </p>
                        <p className="text-sm text-slate-500">
                          {r.serviceSlug ? `${r.serviceSlug} · ` : ""}
                          {formatDateAz(r.createdAt)}
                        </p>
                        {r.preferredDate && (
                          <p className="mt-1 text-xs font-semibold text-brand-700">
                            {t.preferredTime} {formatDateTimeAz(r.preferredDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {r.status !== "COMPLETED" && r.status !== "CANCELLED" && (
                          <EditTimeButton
                            requestId={r.id}
                            hours={parseHours(r.center?.hours)}
                          />
                        )}
                        {r.status !== "COMPLETED" && r.status !== "CANCELLED" && (
                          <CancelRequestButton requestId={r.id} />
                        )}
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                    {r.resultUrl && (
                      <a
                        href={r.resultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 hover:bg-brand-100"
                      >
                        <Download className="h-4 w-4" /> {t.openResult}
                      </a>
                    )}
                    <RentgenDownloadList files={r.files} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Inbox />}
                title={t.reqEmptyTitle}
                description={t.reqEmptyBody}
              >
                <ButtonLink href="/rentgen-merkezleri">
                  <Search className="h-4 w-4" /> {t.findCenter}
                </ButtonLink>
              </EmptyState>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          {reviewable.length > 0 && (
            <Panel title={t.reviewableTitle}>
              <div className="space-y-5">
                {reviewable.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/rentgen-merkezleri/${c.slug}`}
                        className="font-semibold text-ink-900 hover:text-brand-600"
                      >
                        {c.name}
                      </Link>
                      {c.review && (
                        <span className="text-xs text-slate-400">
                          {t.updateReview}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <ReviewForm
                        centerId={c.id}
                        centerName={c.name}
                        defaultScores={
                          c.review
                            ? {
                                service: c.review.scoreService ?? 0,
                                staff: c.review.scoreStaff ?? 0,
                                clean: c.review.scoreClean ?? 0,
                                wait: c.review.scoreWait ?? 0,
                                price: c.review.scorePrice ?? 0,
                              }
                            : undefined
                        }
                        defaultComment={c.review?.comment ?? undefined}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel title={t.quickLinks}>
            <div className="space-y-2">
              <QuickLink href="/rentgen-merkezleri" label={t.findCenter} icon={<Search />} />
              <QuickLink href="/kabinet/secilmisler" label={t.favoritesTitle} icon={<Heart />} />
              <QuickLink href="/kabinet/profil" label={t.editProfile} icon={<User />} />
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-sm font-medium text-ink-800 hover:border-brand-200 hover:bg-brand-50"
    >
      <span className="flex items-center gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-brand-600">
        {icon} {label}
      </span>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
