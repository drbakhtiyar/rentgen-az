import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

/** Shows a renewal warning when the plan expires within 5 days. */
export function PlanExpiryBanner({
  daysLeft,
  planUntil,
  href,
}: {
  daysLeft: number | null;
  planUntil: string | null;
  href: string;
}) {
  if (daysLeft == null || daysLeft > 5) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm font-medium text-amber-900">
          {daysLeft <= 0
            ? "Paketinizin vaxtı bitib — yeniləmək üçün ödəniş lazımdır."
            : `Paketinizin vaxtı bitir${planUntil ? ` (${planUntil})` : ""} — ${daysLeft} gün qalıб. Ödəniş lazımdır.`}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
      >
        Yenilə <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
