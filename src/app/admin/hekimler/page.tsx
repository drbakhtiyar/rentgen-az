import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { DoctorStatusControls, BlockToggle } from "@/components/admin/controls";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, cn } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import type { CenterStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Həkimlər",
  path: "/admin/hekimler",
  noIndex: true,
});

const STATUS_FILTERS: { value: CenterStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Hamısı" },
  { value: "PENDING", label: "Gözləmədə" },
  { value: "APPROVED", label: "Təsdiqlənmiş" },
  { value: "DEACTIVATED", label: "Deaktiv" },
];

const VALID_STATUSES: CenterStatus[] = ["PENDING", "APPROVED", "DEACTIVATED"];

async function getDoctors(status?: CenterStatus) {
  try {
    return await prisma.doctorProfile.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { id: true, isBlocked: true, phone: true } },
        _count: { select: { appointmentRequests: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    return [];
  }
}

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/hekimler");
  const { status: rawStatus } = await searchParams;
  const activeStatus = VALID_STATUSES.includes(rawStatus as CenterStatus)
    ? (rawStatus as CenterStatus)
    : undefined;

  const doctors = await getDoctors(activeStatus);

  return (
    <AdminShell title="Həkimlər" userName={admin.phone}>
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const isActive =
            f.value === "ALL" ? !activeStatus : activeStatus === f.value;
          return (
            <Link
              key={f.value}
              href={
                f.value === "ALL"
                  ? "/admin/hekimler"
                  : `/admin/hekimler?status=${f.value}`
              }
              className={cn(
                "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors",
                isActive
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Panel title="Həkimlər">
        {doctors.length > 0 ? (
          <div className="space-y-3">
            {doctors.map((d) => {
              const fullName =
                [d.firstName, d.lastName].filter(Boolean).join(" ") || "Həkim";
              const meta = [
                d.clinic,
                d.specialization,
                d.city,
                formatPhoneDisplay(d.user.phone),
                `${d._count.appointmentRequests} yönləndirmə`,
                formatDateAz(d.createdAt),
              ].filter(Boolean);
              return (
                <div
                  key={d.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink-900">
                        {fullName}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {meta.join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DoctorStatusControls doctorId={d.id} status={d.status} />
                    <BlockToggle
                      userId={d.user.id}
                      blocked={d.user.isBlocked}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Stethoscope />}
            title="Həkim tapılmadı"
            description="Seçilmiş filtrə uyğun həkim yoxdur."
          />
        )}
      </Panel>
    </AdminShell>
  );
}
