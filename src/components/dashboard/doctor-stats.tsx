import Link from "next/link";
import { Eye, Send, Building2, Lock, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/widgets";
import { doctorLimits } from "@/lib/plans";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import type { Plan } from "@/generated/prisma/client";

type Stats = { views: number; referralsSent: number; partnerCenters: number };

export async function DoctorStats({ plan, stats }: { plan: Plan; stats: Stats }) {
  const t = getPanelDict(await getLocale()).doctor;
  if (!doctorLimits(plan).profileStats) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">{t.dsLockTitle}</p>
            <p className="text-xs text-slate-500">{t.dsLockBody}</p>
          </div>
        </div>
        <Link
          href="/hekim/paket"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t.dsViewPackage} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.dsHeading}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.dsViews} value={stats.views} icon={<Eye />} />
        <StatCard label={t.dsSent} value={stats.referralsSent} icon={<Send />} tone="cyan" />
        <StatCard label={t.dsPartners} value={stats.partnerCenters} icon={<Building2 />} tone="green" />
      </div>
    </div>
  );
}
