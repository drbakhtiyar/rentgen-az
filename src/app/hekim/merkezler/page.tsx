import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Building2, MapPin, MessageSquare } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { RequestPartnerButton } from "@/components/partnership/partnership-buttons";
import { prisma } from "@/lib/db";
import { requireDoctor, doctorNavFor } from "../_lib";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { doctorName } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import type { PartnerStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Partnyor mərkəzlər",
  path: "/hekim/merkezler",
  noIndex: true,
});

export default async function DoctorCentersPage() {
  const { doctor, isOwner } = await requireDoctor("/hekim/merkezler");

  const [centers, partners] = await Promise.all([
    prisma.centerProfile.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, city: true, logoUrl: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.centerDoctor.findMany({
      where: { doctorId: doctor.id },
      select: { centerId: true, status: true },
    }),
  ]);
  const statusByCenter = new Map<string, PartnerStatus>(
    partners.map((p) => [p.centerId, p.status]),
  );

  const fullName =
    doctorName(doctor.firstName, doctor.lastName);
  const pd = getPanelDict(await getLocale());
  const t = pd.doctor;

  return (
    <DashboardShell title={pd.nav.merkezler} roleLabel={pd.shell.roleDoctor} userName={fullName} nav={doctorNavFor(isOwner)}>
      <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-sm text-brand-900">
        {t.centersIntro}
      </div>

      <Panel title={`${t.centersPanel} (${centers.length})`}>
        {centers.length > 0 ? (
          <div className="space-y-2">
            {centers.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <Link
                      href={`/rentgen-merkezleri/${c.slug}`}
                      className="block truncate font-semibold text-ink-900 hover:text-brand-600"
                    >
                      {c.name}
                    </Link>
                    {c.city && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" /> {c.city}
                      </span>
                    )}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  {statusByCenter.get(c.id) === "ACCEPTED" && (
                    <Link
                      href={`/hekim/chat?with=${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Mesaj
                    </Link>
                  )}
                  <RequestPartnerButton
                    centerId={c.id}
                    status={statusByCenter.get(c.id) ?? null}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Building2 />} title={t.centersEmptyTitle} description={t.centersEmptyBody} />
        )}
      </Panel>
    </DashboardShell>
  );
}
