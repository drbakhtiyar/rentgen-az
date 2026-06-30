import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Send, Users, Building2, AlertTriangle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import {
  StatCard,
  Panel,
  EmptyState,
  StatusBadge,
} from "@/components/dashboard/widgets";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "İcmal",
  path: "/hekim",
  noIndex: true,
});

type Referral = {
  id: string;
  name: string;
  phone: string;
  serviceSlug: string | null;
  status: string;
  createdAt: Date;
  centerId: string | null;
  center: { name: string; slug: string } | null;
};

export default async function DoctorDashboardPage() {
  const user = await requireRole("DOCTOR", "/hekim");

  let doctor = null;
  try {
    doctor = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
    });
  } catch {
    doctor = null;
  }
  if (!doctor) redirect("/hekim/qeydiyyat");

  const fullName =
    [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") || "Həkim";

  let requests: Referral[] = [];
  try {
    requests = await prisma.appointmentRequest.findMany({
      where: { doctorId: doctor.id },
      include: { center: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    requests = [];
  }

  const uniquePatients = new Set(requests.map((r) => r.phone)).size;
  const uniqueCenters = new Set(
    requests.map((r) => r.centerId).filter(Boolean),
  ).size;

  // Group referrals by patient phone, preserving createdAt-desc order.
  const groups: { phone: string; name: string; items: Referral[] }[] = [];
  const index = new Map<string, number>();
  for (const r of requests) {
    let i = index.get(r.phone);
    if (i === undefined) {
      i = groups.length;
      index.set(r.phone, i);
      groups.push({ phone: r.phone, name: r.name, items: [] });
    }
    groups[i].items.push(r);
  }

  return (
    <DashboardShell
      title="İcmal"
      roleLabel="Həkim"
      userName={fullName}
      nav={doctorNav}
    >
      {doctor.status !== "APPROVED" && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">
              {doctor.status === "DEACTIVATED"
                ? "Profiliniz deaktiv edilib"
                : "Profiliniz admin təsdiqini gözləyir"}
            </p>
            <p className="mt-0.5">
              Təsdiqlənənə qədər pasiyentlərin seçim siyahısında görünməyəcəksiniz.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Yönləndirmələr"
          value={requests.length}
          icon={<Send />}
          tone="brand"
        />
        <StatCard
          label="Pasiyentlər"
          value={uniquePatients}
          icon={<Users />}
          tone="cyan"
        />
        <StatCard
          label="Mərkəzlər"
          value={uniqueCenters}
          icon={<Building2 />}
          tone="green"
        />
      </div>

      <div className="mt-5">
        <Panel title="Pasiyentlərim">
          {groups.length > 0 ? (
            <div className="space-y-4">
              {groups.map((g) => (
                <div
                  key={g.phone}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-900">{g.name}</span>
                    <span className="text-sm text-slate-500">
                      {formatPhoneDisplay(g.phone)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                      {g.items.length} müraciət
                    </span>
                  </div>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {g.items.map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          {r.center ? (
                            <Link
                              href={`/rentgen-merkezleri/${r.center.slug}`}
                              className="font-medium text-ink-900 hover:text-brand-600"
                            >
                              {r.center.name}
                            </Link>
                          ) : (
                            <span className="font-medium text-slate-500">—</span>
                          )}
                          <span className="ml-2 text-slate-500">
                            {r.serviceSlug || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={r.status} />
                          <span className="text-xs text-slate-400">
                            {formatDateAz(r.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users />}
              title="Hələ yönləndirmə yoxdur"
              description="Pasiyentlər müraciət edərkən sizi seçəndə burada görünəcək."
            />
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
