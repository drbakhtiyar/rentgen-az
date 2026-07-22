import type { Metadata } from "next";
import Link from "next/link";
import { Star, ShieldAlert, Stethoscope } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/reviews/stars";
import { ScoreBreakdown } from "@/components/reviews/score-breakdown";
import { ReviewHideToggle, ReviewModerationButtons } from "@/components/admin/review-controls";
import { CenterSuggestFilter } from "@/components/admin/center-suggest-filter";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, doctorName } from "@/lib/utils";
import { bakuTodayYmd } from "@/lib/hours";
import { mondayOf } from "@/lib/crm";
import { buildMetadata } from "@/lib/seo";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Rəylər",
  path: "/admin/reyler",
  noIndex: true,
});

const PER_PAGE = 30;

const reviewInclude = {
  center: { select: { name: true, slug: true } },
  patient: { select: { firstName: true, lastName: true } },
} as const;

const YMD = /^\d{4}-\d{2}-\d{2}$/;
/** Start-of-period Date (Baku) for a quick range chip. */
function quickStart(range: string): string | null {
  const today = bakuTodayYmd();
  if (range === "today") return today;
  if (range === "week") return mondayOf(today);
  if (range === "month") return `${today.slice(0, 8)}01`;
  return null;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; range?: string; from?: string; to?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/reyler");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = (sp.q ?? "").trim();
  const range = ["today", "week", "month"].includes(sp.range ?? "") ? sp.range! : "";
  // Custom from/to override the quick range; otherwise the chip sets the start.
  const fromYmd = sp.from && YMD.test(sp.from) ? sp.from : range ? quickStart(range) : null;
  const toYmd = sp.to && YMD.test(sp.to) ? sp.to : null;

  const createdAt: Prisma.DateTimeFilter = {};
  if (fromYmd) createdAt.gte = new Date(`${fromYmd}T00:00:00+04:00`);
  if (toYmd) createdAt.lte = new Date(`${toYmd}T23:59:59+04:00`);
  const dateWhere = fromYmd || toYmd ? { createdAt } : {};
  const centerWhere = q ? { center: { name: { contains: q, mode: "insensitive" as const } } } : {};
  const listWhere: Prisma.ReviewWhereInput = { flagged: false, ...centerWhere, ...dateWhere };

  const [flagged, reviews, total] = await Promise.all([
    prisma.review
      .findMany({ where: { flagged: true }, include: reviewInclude, orderBy: { createdAt: "desc" } })
      .catch(() => []),
    prisma.review
      .findMany({
        where: listWhere,
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      })
      .catch(() => []),
    prisma.review.count({ where: listWhere }).catch(() => 0),
  ]);

  // Center names (only those that have reviews) for the search autocomplete.
  const centerNames = (
    await prisma.centerProfile
      .findMany({ where: { reviews: { some: {} } }, select: { name: true }, orderBy: { name: "asc" } })
      .catch(() => [])
  ).map((c) => c.name);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  // Preserve the active filters across pagination.
  const filterQs = new URLSearchParams();
  if (q) filterQs.set("q", q);
  if (sp.range && range) filterQs.set("range", range);
  if (sp.from && YMD.test(sp.from)) filterQs.set("from", sp.from);
  if (toYmd) filterQs.set("to", toYmd);
  const pageUrl = (p: number) => {
    const qs = new URLSearchParams(filterQs);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/admin/reyler?${s}` : "/admin/reyler";
  };
  // Quick-chip link that keeps the center search but resets custom dates + page.
  const chipUrl = (r: string) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (r) qs.set("range", r);
    const s = qs.toString();
    return s ? `/admin/reyler?${s}` : "/admin/reyler";
  };
  const filtered = !!(q || fromYmd || toYmd);

  // Resolve referring-doctor names (admin-only info).
  const docIds = [...new Set([...flagged, ...reviews].map((r) => r.doctorId).filter(Boolean))] as string[];
  const docs = docIds.length
    ? await prisma.doctorProfile
        .findMany({ where: { id: { in: docIds } }, select: { id: true, firstName: true, lastName: true } })
        .catch(() => [])
    : [];
  const docName = new Map(
    docs.map((d) => [d.id, doctorName(d.firstName, d.lastName)]),
  );
  const referrer = (r: { doctorName: string | null; doctorId: string | null }) =>
    r.doctorName || (r.doctorId ? docName.get(r.doctorId) ?? null : null);

  const nameOf = (p: { firstName: string | null; lastName: string | null }) =>
    `${p.firstName ?? ""} ${p.lastName ? p.lastName[0] + "." : ""}`.trim() || "Pasiyent";

  const chip = (r: string, label: string) => {
    const active = r === range || (r === "" && !range && !sp.from && !sp.to);
    return (
      <Link
        href={chipUrl(r)}
        className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors ${
          active ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <AdminShell title="Rəylər" userName={admin.phone}>
      {/* Filter bar: center-name search + quick date ranges + custom range */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
        <form method="get" className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <CenterSuggestFilter
              names={centerNames}
              defaultValue={q}
              preserve={{
                range: sp.range && range ? range : "",
                from: sp.from && YMD.test(sp.from) ? sp.from : "",
                to: toYmd ?? "",
              }}
            />
            <div className="flex items-center gap-2">
              <input
                name="from"
                type="date"
                defaultValue={sp.from && YMD.test(sp.from) ? sp.from : ""}
                className="h-10 rounded-xl border border-slate-200 px-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              <span className="text-slate-400">–</span>
              <input
                name="to"
                type="date"
                defaultValue={toYmd ?? ""}
                className="h-10 rounded-xl border border-slate-200 px-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Süz
              </button>
            </div>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chip("", "Hamısı")}
          {chip("today", "Bu gün")}
          {chip("week", "Bu həftə")}
          {chip("month", "Bu ay")}
          {filtered && (
            <Link href="/admin/reyler" className="ml-1 text-sm font-medium text-slate-400 underline hover:text-slate-600">
              Filtri təmizlə
            </Link>
          )}
        </div>
      </div>

      {flagged.length > 0 && (
        <div className="mb-5">
          <Panel
            title={
              <span className="flex items-center gap-2 text-amber-700">
                <ShieldAlert className="h-4 w-4" /> Moderasiya gözləyən ({flagged.length})
              </span>
            }
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {flagged.map((r) => (
                <div key={r.id} className="flex flex-col rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} size="sm" />
                    {r.center && <span className="font-semibold text-ink-900">{r.center.name}</span>}
                    <span className="text-sm text-slate-500">{nameOf(r.patient)}</span>
                  </div>
                  <ScoreBreakdown review={r} />
                  {r.comment && (
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-700">
                      {r.comment}
                    </p>
                  )}
                  {referrer(r) && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Stethoscope className="h-3.5 w-3.5" /> Göndərən: {referrer(r)}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-amber-100 pt-3">
                    <span className="text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
                    <ReviewModerationButtons reviewId={r.id} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <Panel title={`Rəylər (${total})`}>
        {reviews.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="flex flex-col rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.center && (
                        <Link
                          href={`/rentgen-merkezleri/${r.center.slug}`}
                          className="truncate font-semibold text-ink-900 hover:text-brand-600"
                        >
                          {r.center.name}
                        </Link>
                      )}
                      {r.verified && <Badge tone="green">Təsdiqlənmiş</Badge>}
                      {r.source === "qr" && <Badge tone="cyan">QR</Badge>}
                      {r.hidden && <Badge tone="slate">Gizli</Badge>}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={r.rating} size="sm" />
                      <span className="text-sm text-slate-500">{nameOf(r.patient)}</span>
                    </div>
                  </div>
                  <ReviewHideToggle reviewId={r.id} hidden={r.hidden} />
                </div>

                <ScoreBreakdown review={r} />
                {r.comment && (
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                    {r.comment}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  {referrer(r) && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" /> Göndərən: {referrer(r)}
                    </span>
                  )}
                  <span>{formatDateAz(r.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Star />}
            title={filtered ? "Filtrə uyğun rəy tapılmadı" : "Hələ rəy yoxdur"}
            description={filtered ? "Axtarışı və ya tarix aralığını dəyişin." : undefined}
          />
        )}

        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">
              Səhifə {page} / {pageCount} · {total} rəy
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
