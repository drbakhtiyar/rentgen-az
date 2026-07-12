import type { Metadata } from "next";
import { Users, ShieldOff, Download } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { StatCard, EmptyState, Panel } from "@/components/dashboard/widgets";
import { BlockToggle } from "@/components/admin/controls";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pasiyentlər",
  path: "/admin/pasiyentler",
  noIndex: true,
});

const PER_PAGE = 30;

const SORTS = {
  date_desc: { createdAt: "desc" },
  date_asc: { createdAt: "asc" },
  name_asc: { patientProfile: { firstName: "asc" } },
  name_desc: { patientProfile: { firstName: "desc" } },
} as const;
type SortKey = keyof typeof SORTS;

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/pasiyentler");
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const sort: SortKey = (sp.sort as SortKey) in SORTS ? (sp.sort as SortKey) : "date_desc";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const base: Prisma.UserWhereInput = { patientProfile: { isNot: null } };
  const where: Prisma.UserWhereInput = q
    ? {
        patientProfile: { isNot: null },
        OR: [
          { phone: { contains: q } },
          {
            patientProfile: {
              is: {
                OR: [
                  { firstName: { contains: q, mode: "insensitive" } },
                  { lastName: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      }
    : base;

  const [patients, filteredTotal, total, blockedCount] = await Promise.all([
    prisma.user
      .findMany({
        where,
        include: { patientProfile: true },
        orderBy: SORTS[sort],
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      })
      .catch(() => []),
    prisma.user.count({ where }).catch(() => 0),
    prisma.user.count({ where: base }).catch(() => 0),
    prisma.user.count({ where: { ...base, isBlocked: true } }).catch(() => 0),
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredTotal / PER_PAGE));
  const pageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort !== "date_desc") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/pasiyentler${qs ? `?${qs}` : ""}`;
  };

  return (
    <AdminShell title="Pasiyentlər" userName={admin.phone}>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Ümumi pasiyent sayı" value={total} icon={<Users />} />
        <StatCard
          label="Bloklanmış say"
          value={blockedCount}
          icon={<ShieldOff />}
          tone="amber"
        />
      </div>

      <form
        action="/admin/pasiyentler"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Ad və ya telefon üzrə axtar"
          className="max-w-xs"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="date_desc">Qeydiyyat: yeni əvvəl</option>
          <option value="date_asc">Qeydiyyat: köhnə əvvəl</option>
          <option value="name_asc">Ad: A → Z</option>
          <option value="name_desc">Ad: Z → A</option>
        </select>
        <Button type="submit">Axtar</Button>
      </form>

      <Panel
        title="Pasiyentlər"
        action={
          <a
            href="/admin/export/pasiyentler"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-ink-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> CSV yüklə
          </a>
        }
      >
        {patients.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {patients.map((u) => {
              const name =
                [u.patientProfile?.firstName, u.patientProfile?.lastName]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "Adsız";
              return (
                <div
                  key={u.id}
                  className="flex flex-col rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold text-ink-900">{name}</p>
                    {u.isBlocked && <Badge tone="red">Bloklanıb</Badge>}
                  </div>
                  <a
                    href={`tel:${u.phone}`}
                    className="mt-1 text-sm text-slate-600 hover:text-brand-600"
                  >
                    {formatPhoneDisplay(u.phone)}
                  </a>
                  <p className="text-xs text-slate-400">
                    Qeydiyyat: {formatDateAz(u.createdAt)}
                    {u.patientProfile?.city ? ` · ${u.patientProfile.city}` : ""}
                  </p>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <BlockToggle userId={u.id} blocked={u.isBlocked} />
                  </div>
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

        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">
              Səhifə {page} / {pageCount} · {filteredTotal} pasiyent
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <a href={pageUrl(page - 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                  ← Əvvəlki
                </a>
              ) : (
                <span className="cursor-not-allowed rounded-lg bg-slate-50 px-3 py-1.5 text-slate-300">← Əvvəlki</span>
              )}
              {page < pageCount ? (
                <a href={pageUrl(page + 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                  Növbəti →
                </a>
              ) : (
                <span className="cursor-not-allowed rounded-lg bg-slate-50 px-3 py-1.5 text-slate-300">Növbəti →</span>
              )}
            </div>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
