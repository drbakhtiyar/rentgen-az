import Link from "next/link";
import { Eye, Phone, MessageCircle, Lock, BarChart3, Stethoscope, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/widgets";
import { centerLimits } from "@/lib/plans";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import type { Plan } from "@/generated/prisma/client";

type Basic = { views: number; calls: number; whatsapp: number };
type Full = {
  perService: { slug: string; name: string; count: number }[];
  referralsReceived: number;
  requests30d: number;
};

export async function CenterAnalytics({
  plan,
  stats,
  full,
}: {
  plan: Plan;
  stats: Basic;
  full: Full | null;
}) {
  const limits = centerLimits(plan);
  const t = getPanelDict(await getLocale()).center;

  // Free: no analytics — upsell.
  if (!limits.basicAnalytics) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">{t.anLockTitle}</p>
            <p className="text-xs text-slate-500">{t.anLockBody}</p>
          </div>
        </div>
        <Link
          href="/merkez/paket"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t.viewPackage} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.anLast30}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.anViews} value={stats.views} icon={<Eye />} />
        <StatCard label={t.anCalls} value={stats.calls} icon={<Phone />} tone="cyan" />
        <StatCard label={t.anWhatsapp} value={stats.whatsapp} icon={<MessageCircle />} tone="green" />
      </div>

      {/* Full analytics — Gold+ */}
      {limits.fullAnalytics && full && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <BarChart3 className="h-4 w-4 text-brand-600" /> {t.anPerService}
            </p>
            {full.perService.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {full.perService.map((s) => {
                  const max = full.perService[0]?.count || 1;
                  return (
                    <li key={s.slug}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate text-slate-700">{s.name}</span>
                        <span className="font-semibold text-ink-900">{s.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round((s.count / max) * 100)}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">{t.anNoRequests}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard label={t.anReq30} value={full.requests30d} icon={<BarChart3 />} tone="cyan" />
            <StatCard label={t.anReferrals} value={full.referralsReceived} icon={<Stethoscope />} tone="green" />
          </div>
        </div>
      )}
    </div>
  );
}
