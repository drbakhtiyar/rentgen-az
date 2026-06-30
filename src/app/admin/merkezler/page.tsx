import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { adminNav } from "@/components/dashboard/role-navs";
import { EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { CenterStatusControls, BlockToggle } from "@/components/admin/controls";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import type { CenterStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəzlər",
  path: "/admin/merkezler",
  noIndex: true,
});

const STATUS_FILTERS: { value: CenterStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Hamısı" },
  { value: "PENDING", label: "Gözləmədə" },
  { value: "APPROVED", label: "Təsdiqlənmiş" },
  { value: "DEACTIVATED", label: "Deaktiv" },
];

const VALID_STATUSES: CenterStatus[] = ["PENDING", "APPROVED", "DEACTIVATED"];

async function getCenters(status?: CenterStatus) {
  try {
    return await prisma.centerProfile.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { id: true, isBlocked: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    return [];
  }
}

export default async function AdminCentersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/merkezler");
  const { status: rawStatus } = await searchParams;
  const activeStatus = VALID_STATUSES.includes(rawStatus as CenterStatus)
    ? (rawStatus as CenterStatus)
    : undefined;

  const centers = await getCenters(activeStatus);

  return (
    <DashboardShell
      title="Mərkəzlər"
      roleLabel="Administrator"
      userName={admin.phone}
      nav={adminNav}
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const isActive =
            f.value === "ALL" ? !activeStatus : activeStatus === f.value;
          return (
            <Link
              key={f.value}
              href={
                f.value === "ALL"
                  ? "/admin/merkezler"
                  : `/admin/merkezler?status=${f.value}`
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

      <Panel title="Mərkəzlər">
        {centers.length > 0 ? (
          <div className="space-y-3">
            {centers.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/rentgen-merkezleri/${c.slug}`}
                      className="font-semibold text-ink-900 hover:text-brand-600"
                    >
                      {c.name}
                    </Link>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {[c.city, c.phone].filter(Boolean).join(" · ")} ·{" "}
                    {formatDateAz(c.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CenterStatusControls centerId={c.id} status={c.status} />
                  <BlockToggle
                    userId={c.user.id}
                    blocked={c.user.isBlocked}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Building2 />}
            title="Mərkəz tapılmadı"
            description="Seçilmiş filtrə uyğun mərkəz yoxdur."
          />
        )}
      </Panel>
    </DashboardShell>
  );
}
