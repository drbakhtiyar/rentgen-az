import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  Phone,
  MessageCircle,
  Navigation,
  FileCheck,
  HelpCircle,
  Globe,
  AtSign,
  BarChart3,
} from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState } from "@/components/dashboard/widgets";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəz statistikası",
  path: "/admin/merkez-statistika",
  noIndex: true,
});

/* Admin «Mərkəz statistikası» (2026-08-13, istifadəçi sifarişi):
 * - Dövr: Bu gün (default) / Son 7 gün / Son 30 gün
 * - Yuxarıda seçilmiş dövrün ÜMUMİ statistikası
 * - Yalnız aktivliyi OLAN mərkəzlər (sıfırlılar düşmür), ən aktivlər birinci
 * - Hər blokda metrik ikonları ilə saylar */

const METRICS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "view", label: "Baxış", icon: <Eye /> },
  { key: "call", label: "Zəng", icon: <Phone /> },
  { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle /> },
  { key: "directions", label: "Yol tarifi", icon: <Navigation /> },
  { key: "website", label: "Sayt", icon: <Globe /> },
  { key: "instagram", label: "Instagram", icon: <AtSign /> },
  { key: "license", label: "Lisenziya", icon: <FileCheck /> },
  { key: "faq", label: "FAQ", icon: <HelpCircle /> },
];

/** Dövrün başlanğıcı (Asia/Baku). */
function periodStart(d: "today" | "7" | "30"): Date {
  if (d === "today") {
    const ymd = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
    return new Date(`${ymd}T00:00:00+04:00`);
  }
  return new Date(Date.now() - (d === "7" ? 7 : 30) * 24 * 3600_000);
}

export default async function AdminCenterStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/merkez-statistika");
  const sp = await searchParams;
  const period: "today" | "7" | "30" = sp.d === "7" ? "7" : sp.d === "30" ? "30" : "today";
  const since = periodStart(period);

  const rows = await prisma.centerEvent
    .groupBy({
      by: ["centerId", "type"],
      where: { createdAt: { gte: since } },
      _count: { type: true },
    })
    .catch(() => []);

  // Mərkəz üzrə cəm + ümumi cəmlər
  const byCenter = new Map<string, Record<string, number>>();
  const totals: Record<string, number> = {};
  for (const r of rows) {
    const m = byCenter.get(r.centerId) ?? {};
    m[r.type] = (m[r.type] ?? 0) + r._count.type;
    byCenter.set(r.centerId, m);
    totals[r.type] = (totals[r.type] ?? 0) + r._count.type;
  }

  const centerIds = [...byCenter.keys()];
  const centers = centerIds.length
    ? await prisma.centerProfile
        .findMany({
          where: { id: { in: centerIds } },
          select: { id: true, name: true, slug: true, city: true, plan: true },
        })
        .catch(() => [])
    : [];
  const centerInfo = new Map(centers.map((c) => [c.id, c]));

  // Aktivliyə görə azalan sıra
  const ranked = centerIds
    .map((id) => ({
      id,
      info: centerInfo.get(id),
      m: byCenter.get(id)!,
      total: Object.values(byCenter.get(id)!).reduce((a, b) => a + b, 0),
    }))
    .filter((r) => r.info && r.total > 0)
    .sort((a, b) => b.total - a.total);

  const periodLabel = period === "today" ? "bu gün" : period === "7" ? "son 7 gün" : "son 30 gün";

  const tab = (d: "today" | "7" | "30", label: string) => (
    <Link
      key={d}
      href={d === "today" ? "/admin/merkez-statistika" : `/admin/merkez-statistika?d=${d}`}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors ${
        period === d
          ? "bg-brand-600 text-white ring-brand-600"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <AdminShell title="Mərkəz statistikası" userName={admin.phone}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {periodLabel[0].toUpperCase() + periodLabel.slice(1)}{" "}
          <span className="font-semibold text-ink-900">{ranked.length} mərkəzdə</span> aktivlik var.
        </p>
        <div className="flex gap-2">
          {tab("today", "Bu gün")}
          {tab("7", "Son 7 gün")}
          {tab("30", "Son 30 gün")}
        </div>
      </div>

      {/* Ümumi statistika — seçilmiş dövr */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {METRICS.map((m) => (
          <div key={m.key} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center">
            <span className="mx-auto flex h-7 w-7 items-center justify-center text-brand-600 [&>svg]:h-4 [&>svg]:w-4">
              {m.icon}
            </span>
            <div className="font-display text-xl font-bold text-ink-900">{totals[m.key] ?? 0}</div>
            <div className="text-[11px] font-medium text-slate-500">{m.label}</div>
          </div>
        ))}
      </div>

      {ranked.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((r, i) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/merkezler/${r.id}`}
                    className="font-display truncate text-[15px] font-bold text-ink-900 hover:text-brand-600"
                  >
                    {i + 1}. {r.info!.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {[r.info!.city, r.info!.plan].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                  {r.total}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {METRICS.filter((m) => (r.m[m.key] ?? 0) > 0).map((m) => (
                  <span
                    key={m.key}
                    title={m.label}
                    className="flex items-center gap-1.5 text-sm text-slate-600 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-brand-500"
                  >
                    {m.icon}
                    <span className="font-semibold text-ink-900">{r.m[m.key]}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BarChart3 />}
          title="Bu dövrdə aktivlik yoxdur"
          description="Seçilmiş dövrdə heç bir mərkəzdə klik/baxış qeydə alınmayıb."
        />
      )}
    </AdminShell>
  );
}
