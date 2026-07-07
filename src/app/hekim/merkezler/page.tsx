import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Building2, MapPin } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { RequestPartnerButton } from "@/components/partnership/partnership-buttons";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";
import type { PartnerStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Partnyor mərkəzlər",
  path: "/hekim/merkezler",
  noIndex: true,
});

export default async function DoctorCentersPage() {
  const user = await requireRole("DOCTOR", "/hekim/merkezler");
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, firstName: true, lastName: true, status: true },
  });
  if (!doctor) redirect("/hekim/qeydiyyat");

  const [centers, partners] = await Promise.all([
    prisma.centerProfile.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, city: true, logoUrl: true },
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
    [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") || "Həkim";

  return (
    <DashboardShell title="Partnyor mərkəzlər" roleLabel="Həkim" userName={fullName} nav={doctorNav}>
      <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-sm text-brand-900">
        Mərkəzlərlə əməkdaşlıq qurun. Sorğunuz qəbul edildikdən sonra həmin
        mərkəzə yönləndirdiyiniz pasiyentlərin rentgen nəticələrini panelinizdə
        görə biləcəksiniz.
      </div>

      <Panel title={`Mərkəzlər (${centers.length})`}>
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
                    <span className="block truncate font-semibold text-ink-900">{c.name}</span>
                    {c.city && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" /> {c.city}
                      </span>
                    )}
                  </span>
                </span>
                <RequestPartnerButton
                  centerId={c.id}
                  status={statusByCenter.get(c.id) ?? null}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Building2 />} title="Mərkəz yoxdur" description="Təsdiqlənmiş mərkəz hələ yoxdur." />
        )}
      </Panel>
    </DashboardShell>
  );
}
