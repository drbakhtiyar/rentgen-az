import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Download, Plus } from "lucide-react";
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
import {
  type HasKey,
  HAS_FILTERS,
  HAS_WHERE,
  completeness,
  parseHas,
  baseWhere,
} from "@/lib/center-filters";

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

async function getCenters(
  status: CenterStatus | undefined,
  q: string | undefined,
  has: HasKey[],
  sort: "full" | "new",
) {
  try {
    const where = baseWhere(status, q);
    if (has.length) where.AND = has.map((k) => HAS_WHERE[k]);
    const centers = await prisma.centerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, isBlocked: true } },
        services: { take: 4, include: { service: { select: { name: true, shortName: true } } } },
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: "desc" },
      // completeness sort needs the full set in memory; cap generously
      take: sort === "full" ? 400 : 100,
    });
    if (sort === "full") {
      return centers
        .map((c) => ({ c, score: completeness(c) }))
        .sort((a, b) => b.score - a.score)
        .map((x) => x.c);
    }
    return centers;
  } catch {
    return [];
  }
}

export default async function AdminCentersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; has?: string; sort?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/merkezler");
  const { status: rawStatus, q, has: rawHas, sort: rawSort } = await searchParams;
  const activeStatus = VALID_STATUSES.includes(rawStatus as CenterStatus)
    ? (rawStatus as CenterStatus)
    : undefined;
  const activeHas = parseHas(rawHas);
  const sort: "full" | "new" = rawSort === "new" ? "new" : "full";

  const centers = await getCenters(activeStatus, q, activeHas, sort);
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));

  // Completeness breakdown for the active status (independent of has-filters)
  const cb = baseWhere(activeStatus, q);
  const [total, nPhone, nPhoto, nRating, nHours] = await Promise.all([
    prisma.centerProfile.count({ where: cb }),
    prisma.centerProfile.count({ where: { ...cb, ...HAS_WHERE.phone } }),
    prisma.centerProfile.count({ where: { ...cb, ...HAS_WHERE.photo } }),
    prisma.centerProfile.count({ where: { ...cb, ...HAS_WHERE.rating } }),
    prisma.centerProfile.count({ where: { ...cb, ...HAS_WHERE.hours } }),
  ]).catch(() => [0, 0, 0, 0, 0]);

  // Preserve status+q across filter/sort links; toggle a single `has` key.
  const buildHref = (over: { has?: HasKey[]; sort?: "full" | "new" }) => {
    const sp = new URLSearchParams();
    if (activeStatus) sp.set("status", activeStatus);
    if (q) sp.set("q", q);
    const hs = over.has ?? activeHas;
    if (hs.length) sp.set("has", hs.join(","));
    const st = over.sort ?? sort;
    if (st === "new") sp.set("sort", "new");
    const s = sp.toString();
    return s ? `/admin/merkezler?${s}` : "/admin/merkezler";
  };
  const toggleHas = (k: HasKey) =>
    activeHas.includes(k) ? activeHas.filter((x) => x !== k) : [...activeHas, k];

  return (
    <AdminShell title="Mərkəzlər" userName={admin.phone}>
      <div className="mb-4 flex flex-wrap gap-2">
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

      {/* Data-completeness quick filters + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {HAS_FILTERS.map((f) => {
          const on = activeHas.includes(f.key);
          return (
            <Link
              key={f.key}
              href={buildHref({ has: toggleHas(f.key) })}
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors",
                on
                  ? "bg-cyan-600 text-white ring-cyan-600"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <Link
          href={buildHref({ sort: "full" })}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors",
            sort === "full"
              ? "bg-ink-900 text-white ring-ink-900"
              : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
          )}
        >
          Ən dolğun əvvəl
        </Link>
        <Link
          href={buildHref({ sort: "new" })}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors",
            sort === "new"
              ? "bg-ink-900 text-white ring-ink-900"
              : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
          )}
        >
          Ən yeni
        </Link>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        {activeStatus === "PENDING" ? "Gözləmədə" : "Cəmi"}: <b>{total}</b>
        {"  ·  "}📞 {nPhone}{"  ·  "}🖼 {nPhoto}{"  ·  "}⭐ {nRating}{"  ·  "}🕐 {nHours}
        {activeHas.length > 0 && (
          <>
            {"  —  "}filtrlə uyğun: <b>{centers.length}</b>
          </>
        )}
      </p>

      <form
        action="/admin/merkezler"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        {activeStatus && (
          <input type="hidden" name="status" value={activeStatus} />
        )}
        {activeHas.length > 0 && (
          <input type="hidden" name="has" value={activeHas.join(",")} />
        )}
        {sort === "new" && <input type="hidden" name="sort" value="new" />}
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
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/merkezler/yeni"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Yeni mərkəz
            </Link>
            <a
              href="/admin/export/merkezler"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-ink-800 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> CSV yüklə
            </a>
          </div>
        }
      >
        {centers.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {centers.map((c) => (
              <AdminCenterCard
                key={c.id}
                center={c}
                rating={ratings[c.id]}
                serviceCount={c._count.services}
                completeness={completeness(c)}
              />
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
