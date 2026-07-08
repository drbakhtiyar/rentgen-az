import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { AdminDoctorCard } from "@/components/admin/admin-doctor-card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";
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
          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {doctors.map((d) => (
              <AdminDoctorCard key={d.id} doctor={d} />
            ))}
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
