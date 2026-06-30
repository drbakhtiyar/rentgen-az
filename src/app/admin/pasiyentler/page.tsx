import type { Metadata } from "next";
import { Users, ShieldOff } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { adminNav } from "@/components/dashboard/role-navs";
import { StatCard, EmptyState, Panel } from "@/components/dashboard/widgets";
import { BlockToggle } from "@/components/admin/controls";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pasiyentlər",
  path: "/admin/pasiyentler",
  noIndex: true,
});

async function getPatients() {
  try {
    return await prisma.user.findMany({
      where: { role: "PATIENT" },
      include: { patientProfile: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    return [];
  }
}

export default async function AdminPatientsPage() {
  const admin = await requireRole("ADMIN", "/admin/pasiyentler");
  const patients = await getPatients();

  const total = patients.length;
  const blockedCount = patients.filter((u) => u.isBlocked).length;

  return (
    <DashboardShell
      title="Pasiyentlər"
      roleLabel="Administrator"
      userName={admin.phone}
      nav={adminNav}
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Ümumi pasiyent sayı" value={total} icon={<Users />} />
        <StatCard
          label="Bloklanmış say"
          value={blockedCount}
          icon={<ShieldOff />}
          tone="amber"
        />
      </div>

      <Panel title="Pasiyentlər">
        {patients.length > 0 ? (
          <div className="space-y-3">
            {patients.map((u) => {
              const name =
                [u.patientProfile?.firstName, u.patientProfile?.lastName]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "Adsız";
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink-900">{name}</p>
                      {u.isBlocked && <Badge tone="red">Bloklanıb</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {[
                        formatPhoneDisplay(u.phone),
                        u.patientProfile?.city,
                        `Qeydiyyat: ${formatDateAz(u.createdAt)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <BlockToggle userId={u.id} blocked={u.isBlocked} />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Users />}
            title="Pasiyent tapılmadı"
            description="Hələ qeydiyyatdan keçmiş pasiyent yoxdur."
          />
        )}
      </Panel>
    </DashboardShell>
  );
}
