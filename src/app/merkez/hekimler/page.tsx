import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Stethoscope, MailQuestion } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { RespondPartnerButtons } from "@/components/partnership/partnership-buttons";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Partnyor həkimlər",
  path: "/merkez/hekimler",
  noIndex: true,
});

const doctorInclude = {
  doctor: {
    select: { firstName: true, lastName: true, clinic: true, city: true, specializations: true },
  },
} as const;

function docName(d: { firstName: string | null; lastName: string | null }) {
  return [d.firstName, d.lastName].filter(Boolean).join(" ") || "Həkim";
}

export default async function CenterDoctorsPage() {
  const user = await requireRole("CENTER", "/merkez/hekimler");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const [pending, accepted] = await Promise.all([
    prisma.centerDoctor.findMany({
      where: { centerId: center.id, status: "PENDING" },
      include: doctorInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.centerDoctor.findMany({
      where: { centerId: center.id, status: "ACCEPTED" },
      include: doctorInclude,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <DashboardShell title="Partnyor həkimlər" roleLabel="Rentgen mərkəzi" userName={center.name} nav={centerNav}>
      {pending.length > 0 && (
        <div className="mb-5">
          <Panel
            title={
              <span className="flex items-center gap-2 text-amber-700">
                <MailQuestion className="h-4 w-4" /> Gözləyən sorğular ({pending.length})
              </span>
            }
          >
            <div className="space-y-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">{docName(p.doctor)}</p>
                    <p className="text-sm text-slate-500">
                      {[p.doctor.clinic, p.doctor.city].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {p.doctor.specializations.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        {p.doctor.specializations.join(", ")}
                      </p>
                    )}
                  </div>
                  <RespondPartnerButtons partnerId={p.id} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <Panel title={`Partnyor həkimlər (${accepted.length})`}>
        {accepted.length > 0 ? (
          <div className="space-y-2">
            {accepted.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Stethoscope className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink-900">{docName(p.doctor)}</span>
                    <span className="text-xs text-slate-400">
                      {[p.doctor.clinic, p.doctor.city].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                </span>
                <Badge tone="green">Partnyor</Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Stethoscope />}
            title="Hələ partnyor həkim yoxdur"
            description="Həkimlər əməkdaşlıq sorğusu göndərdikdə burada görünəcək."
          />
        )}
      </Panel>
    </DashboardShell>
  );
}
