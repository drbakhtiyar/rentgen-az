import Link from "next/link";
import { Eye, Send, Building2, Lock, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/widgets";
import { doctorLimits } from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";

type Stats = { views: number; referralsSent: number; partnerCenters: number };

export function DoctorStats({ plan, stats }: { plan: Plan; stats: Stats }) {
  if (!doctorLimits(plan).profileStats) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Statistika Silver paketdən başlayır</p>
            <p className="text-xs text-slate-500">Profil baxışları və göndəriş statistikanızı görmək üçün paketi yüksəldin.</p>
          </div>
        </div>
        <Link
          href="/hekim/paket"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Paketə bax <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Statistika</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Profil baxışları (30 gün)" value={stats.views} icon={<Eye />} />
        <StatCard label="Göndərdiyiniz pasiyentlər" value={stats.referralsSent} icon={<Send />} tone="cyan" />
        <StatCard label="Partnyor mərkəzlər" value={stats.partnerCenters} icon={<Building2 />} tone="green" />
      </div>
    </div>
  );
}
