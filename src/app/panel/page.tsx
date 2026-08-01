import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { OperatorShell } from "@/components/operator/operator-shell";
import { OperatorCenterCard } from "@/components/operator/operator-center-card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { getRatingsForCenters } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import type { CenterStatus } from "@/generated/prisma/enums";
import { HAS_FILTERS, HAS_WHERE, completeness, parseHas, baseWhere } from "@/lib/center-filters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Operator paneli",
  path: "/panel",
  noIndex: true,
});

const STATUS_FILTERS: { value: CenterStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Hamısı" },
  { value: "PENDING", label: "Gözləmədə" },
  { value: "APPROVED", label: "Təsdiqli" },
  { value: "DEACTIVATED", label: "Deaktiv" },
];
const VALID_STATUSES: CenterStatus[] = ["PENDING", "APPROVED", "DEACTIVATED"];

export default async function PanelHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; has?: string; sort?: string }>;
}) {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  const { status: rawStatus, q, has: rawHas, sort: rawSort } = await searchParams;
  const activeStatus = VALID_STATUSES.includes(rawStatus as CenterStatus)
    ? (rawStatus as CenterStatus)
    : undefined;
  const activeHas = parseHas(rawHas);
  const sort: "full" | "new" = rawSort === "new" ? "new" : "full";

  const where = baseWhere(activeStatus, q);
  if (activeHas.length) where.AND = activeHas.map((k) => HAS_WHERE[k]);

  const rows = await prisma.centerProfile.findMany({
    where,
    include: {
      services: { take: 4, include: { service: { select: { name: true, shortName: true } } } },
      _count: { select: { services: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: sort === "full" ? 400 : 100,
  });
  const centers =
    sort === "full"
      ? rows.map((c) => ({ c, s: completeness(c) })).sort((a, b) => b.s - a.s).map((x) => x.c)
      : rows;
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));

  const cb = baseWhere(activeStatus, q);
  const [total, nPhone, nMobile, nPhoto, nRating, nHours] = await Promise.all([
    prisma.centerProfile.count({ where: cb }),
    prisma.centerProfile.count({ where: { AND: [cb, HAS_WHERE.phone] } }),
    prisma.centerProfile.count({ where: { AND: [cb, HAS_WHERE.mobile] } }),
    prisma.centerProfile.count({ where: { AND: [cb, HAS_WHERE.photo] } }),
    prisma.centerProfile.count({ where: { AND: [cb, HAS_WHERE.rating] } }),
    prisma.centerProfile.count({ where: { AND: [cb, HAS_WHERE.hours] } }),
  ]).catch(() => [0, 0, 0, 0, 0, 0]);

  const buildHref = (over: {
    status?: CenterStatus | "ALL";
    has?: (typeof activeHas)[number][];
    sort?: "full" | "new";
  }) => {
    const sp = new URLSearchParams();
    const st = over.status ?? activeStatus;
    if (st && st !== "ALL") sp.set("status", st);
    if (q) sp.set("q", q);
    const hs = over.has ?? activeHas;
    if (hs.length) sp.set("has", hs.join(","));
    const so = over.sort ?? sort;
    if (so === "new") sp.set("sort", "new");
    const s = sp.toString();
    return s ? `/panel?${s}` : "/panel";
  };
  const toggleHas = (k: (typeof activeHas)[number]) =>
    activeHas.includes(k) ? activeHas.filter((x) => x !== k) : [...activeHas, k];

  const userName = user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator";
  const chip = "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors";

  return (
    <OperatorShell title={`Mərkəzlər (${total})`} userName={userName}>
      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const isActive = f.value === "ALL" ? !activeStatus : activeStatus === f.value;
          return (
            <Link
              key={f.value}
              href={buildHref({ status: f.value })}
              className={cn(
                "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors",
                isActive ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Completeness quick filters + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {HAS_FILTERS.map((f) => {
          const on = activeHas.includes(f.key);
          return (
            <Link
              key={f.key}
              href={buildHref({ has: toggleHas(f.key) })}
              className={cn(chip, on ? "bg-cyan-600 text-white ring-cyan-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50")}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <Link href={buildHref({ sort: "full" })} className={cn(chip, sort === "full" ? "bg-ink-900 text-white ring-ink-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50")}>
          Ən dolğun əvvəl
        </Link>
        <Link href={buildHref({ sort: "new" })} className={cn(chip, sort === "new" ? "bg-ink-900 text-white ring-ink-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50")}>
          Ən yeni
        </Link>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        {activeStatus === "PENDING" ? "Gözləmədə" : "Cəmi"}: <b>{total}</b>
        {"  ·  "}📞 {nPhone}{"  ·  "}📱 {nMobile}{"  ·  "}🖼 {nPhoto}{"  ·  "}⭐ {nRating}{"  ·  "}🕐 {nHours}
        {activeHas.length > 0 && <>{"  —  "}filtrlə uyğun: <b>{centers.length}</b></>}
      </p>

      <form action="/panel" className="mb-5 flex flex-wrap items-center gap-2">
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        {activeHas.length > 0 && <input type="hidden" name="has" value={activeHas.join(",")} />}
        {sort === "new" && <input type="hidden" name="sort" value="new" />}
        <Input name="q" defaultValue={q ?? ""} placeholder="Ad, telefon, şəhər və ya ünvan üzrə axtar" className="max-w-xs" />
        <Button type="submit">Axtar</Button>
      </form>

      {centers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            {q || activeHas.length ? "Filtrə uyğun mərkəz tapılmadı." : "Hələ mərkəz yoxdur."}
          </p>
          <Link href="/panel/yeni" className="mt-4 inline-flex rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Yeni mərkəz əlavə et
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {centers.map((c) => (
            <OperatorCenterCard
              key={c.id}
              center={c}
              rating={ratings[c.id]}
              serviceCount={c._count.services}
              completeness={completeness(c)}
            />
          ))}
        </div>
      )}
    </OperatorShell>
  );
}
