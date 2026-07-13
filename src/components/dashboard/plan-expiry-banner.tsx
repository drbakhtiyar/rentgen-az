import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";

/** Shows a renewal warning when the plan expires within 5 days. */
export async function PlanExpiryBanner({
  daysLeft,
  planUntil,
  href,
}: {
  daysLeft: number | null;
  planUntil: string | null;
  href: string;
}) {
  if (daysLeft == null || daysLeft > 5) return null;
  const t = getPanelDict(await getLocale()).center;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm font-medium text-amber-900">
          {daysLeft <= 0
            ? t.planExpired
            : `${t.planExpiringPre}${planUntil ? ` (${planUntil})` : ""} — ${daysLeft} ${t.planExpiringPost}`}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
      >
        {t.renew} <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
