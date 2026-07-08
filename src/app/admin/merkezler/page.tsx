import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Download } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { AdminCenterCard } from "@/components/admin/admin-center-card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getRatingsForCenters } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import type { CenterStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

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

async function getCenters(status?: CenterStatus, q?: string) {
  try {
    const where: Prisma.CenterProfileWhereInput = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }
    return await prisma.centerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, isBlocked: true } },
        services: { include: { service: { select: { name: true, shortName: true } } } },
      },
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
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/merkezler");
  const { status: rawStatus, q } = await searchParams;
  const activeStatus = VALID_STATUSES.includes(rawStatus as CenterStatus)
    ? (rawStatus as CenterStatus)
    : undefined;

  const centers = await getCenters(activeStatus, q);
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));

  return (
    <AdminShell title="Mərkəzlər" userName={admin.phone}>
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

      <form
        action="/admin/merkezler"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        {activeStatus && (
          <input type="hidden" name="status" value={activeStatus} />
        )}
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Ad, telefon və ya şəhər üzrə axtar"
          className="max-w-xs"
        />
        <Button type="submit">Axtar</Button>
      </form>

      <Panel
        title="Mərkəzlər"
        action={
          <a
            href="/admin/export/merkezler"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-ink-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> CSV yüklə
          </a>
        }
      >
        {centers.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {centers.map((c) => (
              <AdminCenterCard key={c.id} center={c} rating={ratings[c.id]} />
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
    </AdminShell>
  );
}
