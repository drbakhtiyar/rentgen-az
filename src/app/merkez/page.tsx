import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Inbox,
  ListChecks,
  Eye,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { StatCard, EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getCenterEventStats } from "@/lib/queries";
import { formatDateAz, formatDateTimeAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { RequestStatusControl } from "./request-status-control";
import { RequestResultForm } from "./request-result-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəz kabineti",
  path: "/merkez",
  noIndex: true,
});

export default async function CenterDashboardPage() {
  const user = await requireRole("CENTER", "/merkez");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    include: { _count: { select: { services: true, appointmentRequests: true } } },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const requests = await prisma.appointmentRequest.findMany({
    where: { centerId: center.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const newCount = await prisma.appointmentRequest.count({
    where: { centerId: center.id, status: "NEW" },
  });
  const stats = await getCenterEventStats(center.id, 30);

  // Approved doctors for manual referring-doctor assignment.
  const doctorOptions = (
    await prisma.doctorProfile.findMany({
      where: { status: "APPROVED" },
      select: { id: true, firstName: true, lastName: true, clinic: true },
      orderBy: { firstName: "asc" },
    })
  ).map((d) => ({
    value: d.id,
    label:
      [d.firstName, d.lastName].filter(Boolean).join(" ") +
      (d.clinic ? ` — ${d.clinic}` : ""),
  }));

  const name =
    center.name ||
    [user.patientProfile?.firstName, user.patientProfile?.lastName].filter(Boolean).join(" ") ||
    "Mərkəz";

  return (
    <DashboardShell title="İcmal" roleLabel="Rentgen mərkəzi" userName={name} nav={centerNav}>
      {center.status !== "APPROVED" && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">
              {center.status === "PENDING"
                ? "Profiliniz admin təsdiqini gözləyir"
                : "Profiliniz deaktiv edilib"}
            </p>
            <p className="text-sm text-amber-800">
              {center.status === "PENDING"
                ? "Təsdiqdən sonra mərkəziniz axtarış nəticələrində görünəcək. Bu vaxt ərzində profil və xidmətləri tamamlaya bilərsiniz."
                : "Yenidən aktivləşdirmə üçün adminlə əlaqə saxlayın."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Status" value={<StatusBadge status={center.status} />} icon={<Building2 />} />
        <StatCard label="Yeni müraciətlər" value={newCount} icon={<Inbox />} tone="amber" />
        <StatCard label="Ümumi müraciətlər" value={center._count.appointmentRequests} icon={<Inbox />} tone="cyan" />
        <StatCard label="Xidmətlər" value={center._count.services} icon={<ListChecks />} tone="green" />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Son 30 gün
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Profil baxışları" value={stats.views} icon={<Eye />} />
          <StatCard label="Zəng klikləri" value={stats.calls} icon={<Inbox />} tone="cyan" />
          <StatCard label="WhatsApp klikləri" value={stats.whatsapp} icon={<Inbox />} tone="green" />
        </div>
      </div>

      {center._count.services === 0 && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-brand-600" />
            <p className="text-sm text-brand-900">
              Hələ xidmət əlavə etməmisiniz. Pasiyentlərin sizi tapması üçün xidmət və qiymətləri əlavə edin.
            </p>
          </div>
          <ButtonLink href="/merkez/xidmetler" size="sm" className="shrink-0">
            Əlavə et
          </ButtonLink>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Son müraciətlər"
            action={
              center.status === "APPROVED" && (
                <Link
                  href={`/rentgen-merkezleri/${center.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Eye className="h-4 w-4" /> Profilə bax
                </Link>
              )
            }
          >
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-100 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">{r.name}</p>
                        <p className="text-sm text-slate-500">
                          <a href={`tel:${r.phone}`} className="hover:text-brand-600">
                            {r.phone}
                          </a>
                          {r.serviceSlug ? ` · ${r.serviceSlug}` : ""}
                        </p>
                        {r.preferredDate && (
                          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                            <Clock className="h-3 w-3" /> {formatDateTimeAz(r.preferredDate)}
                          </p>
                        )}
                        {r.note && <p className="mt-1 text-sm text-slate-600">{r.note}</p>}
                        <p className="mt-1 text-xs text-slate-400">{formatDateAz(r.createdAt)}</p>
                      </div>
                      <RequestStatusControl id={r.id} status={r.status} />
                    </div>
                    {r.status === "COMPLETED" && (
                      <RequestResultForm
                        requestId={r.id}
                        defaultUrl={r.resultUrl}
                        doctorId={r.doctorId}
                        doctors={doctorOptions}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Inbox />}
                title="Hələ müraciət yoxdur"
                description="Pasiyent müraciətləri burada görünəcək."
              />
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Tez keçidlər">
            <div className="space-y-2">
              <QuickLink href="/merkez/profil" label="Profili redaktə et" icon={<Building2 />} />
              <QuickLink href="/merkez/xidmetler" label="Xidmət və qiymətlər" icon={<ListChecks />} />
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
