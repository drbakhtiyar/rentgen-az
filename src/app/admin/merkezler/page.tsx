import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Download } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { CenterStatusControls, BlockToggle } from "@/components/admin/controls";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, cn } from "@/lib/utils";
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
          <div className="space-y-3">
            {centers.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {c.status === "APPROVED" ? (
                        <Link
                          href={`/rentgen-merkezleri/${c.slug}`}
                          className="font-semibold text-ink-900 hover:text-brand-600"
                        >
                          {c.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-ink-900">{c.name}</span>
                      )}
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {[c.city, c.phone].filter(Boolean).join(" · ")} ·{" "}
                      {formatDateAz(c.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CenterStatusControls centerId={c.id} status={c.status} />
                    <BlockToggle userId={c.user.id} blocked={c.user.isBlocked} />
                  </div>
                </div>

                {/* Submitted details for review */}
                <dl className="mt-3 grid gap-x-6 gap-y-1.5 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2">
                  {c.responsiblePerson && (
                    <Detail label="Məsul şəxs" value={c.responsiblePerson} />
                  )}
                  {c.whatsapp && <Detail label="WhatsApp" value={c.whatsapp} />}
                  {c.address && <Detail label="Ünvan" value={c.address} />}
                  {c.workingHours && (
                    <Detail label="İş saatları" value={c.workingHours} />
                  )}
                  {c.equipment && <Detail label="Avadanlıq" value={c.equipment} />}
                  {c.mapsUrl && <Detail label="Xəritə" value={c.mapsUrl} />}
                </dl>
                {c.description && (
                  <p className="mt-2 text-sm text-slate-600">{c.description}</p>
                )}
                {c.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.services.map((cs) => (
                      <span
                        key={cs.id}
                        className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700 ring-1 ring-inset ring-cyan-100"
                      >
                        {cs.service.shortName ?? cs.service.name}
                        {cs.price != null ? ` · ${cs.price}₼` : ""}
                      </span>
                    ))}
                  </div>
                )}
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
    </AdminShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-slate-400">{label}:</dt>
      <dd className="min-w-0 break-words font-medium text-ink-800">{value}</dd>
    </div>
  );
}
