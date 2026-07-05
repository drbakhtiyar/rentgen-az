import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Heart, User, ArrowRight, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { patientNav } from "@/components/dashboard/role-navs";
import { StatCard, EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { ButtonLink } from "@/components/ui/button";
import { MarkReceivedButton } from "@/components/reviews/mark-received-button";
import { CancelRequestButton } from "@/components/reviews/cancel-request-button";
import { ReviewForm } from "@/components/reviews/review-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getReviewableCentersForPatient } from "@/lib/queries";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDateAz, formatDateTimeAz } from "@/lib/utils";
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
    include: { center: { select: { name: true, slug: true } } },
  });

  const reviewable = profile
    ? await getReviewableCentersForPatient(profile.id)
    : [];

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Pasiyent";
  const profileIncomplete = !profile?.firstName || !profile?.lastName;

  return (
    <DashboardShell title={`Salam, ${name}`} roleLabel="Pasiyent" userName={name} nav={patientNav}>
      {profileIncomplete && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-brand-600" />
            <p className="text-sm text-brand-900">
              Profilinizi tamamlayın — ad və soyadınızı əlavə edin.
            </p>
          </div>
          <ButtonLink href="/kabinet/profil" size="sm" className="shrink-0">
            Tamamla
          </ButtonLink>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Müraciətlər" value={profile?._count.appointmentRequests ?? 0} icon={<Inbox />} />
        <StatCard label="Seçilmiş mərkəzlər" value={profile?._count.favoriteCenters ?? 0} icon={<Heart />} tone="cyan" />
        <StatCard label="Telefon" value={<span className="text-base">{formatPhoneDisplay(user.phone)}</span>} icon={<User />} tone="slate" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Müraciət tarixçəsi">
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">
                        {r.center ? (
                          <Link href={`/rentgen-merkezleri/${r.center.slug}`} className="hover:text-brand-600">
                            {r.center.name}
                          </Link>
                        ) : (
                          "Ümumi müraciət"
                        )}
                      </p>
                      <p className="text-sm text-slate-500">
                        {r.serviceSlug ? `${r.serviceSlug} · ` : ""}
                        {formatDateAz(r.createdAt)}
                      </p>
                      {r.preferredDate && (
                        <p className="mt-1 text-xs font-semibold text-brand-700">
                          Seçilmiş vaxt: {formatDateTimeAz(r.preferredDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status !== "COMPLETED" && r.status !== "CANCELLED" && (
                        <CancelRequestButton requestId={r.id} />
                      )}
                      {r.center &&
                        r.status !== "COMPLETED" &&
                        r.status !== "CANCELLED" && (
                          <MarkReceivedButton requestId={r.id} />
                        )}
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Inbox />}
                title="Hələ müraciətiniz yoxdur"
                description="Mərkəz axtarıb müraciət göndərdikdə burada görünəcək."
              >
                <ButtonLink href="/rentgen-merkezleri">
                  <Search className="h-4 w-4" /> Mərkəz axtar
                </ButtonLink>
              </EmptyState>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          {reviewable.length > 0 && (
            <Panel title="Rəy yaza biləcəyiniz mərkəzlər">
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
                          Rəyinizi yeniləyə bilərsiniz
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <ReviewForm
                        centerId={c.id}
                        centerName={c.name}
                        defaultRating={c.review?.rating}
                        defaultComment={c.review?.comment ?? undefined}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel title="Tez keçidlər">
            <div className="space-y-2">
              <QuickLink href="/rentgen-merkezleri" label="Mərkəz axtar" icon={<Search />} />
              <QuickLink href="/kabinet/secilmisler" label="Seçilmiş mərkəzlər" icon={<Heart />} />
              <QuickLink href="/kabinet/profil" label="Profili redaktə et" icon={<User />} />
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
