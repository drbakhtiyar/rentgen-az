import Link from "next/link";
import { Headset, ArrowUpRight } from "lucide-react";

/** Priority support card — shown to Gold+ center / doctor dashboards. */
export function SupportCard({ chatHref }: { chatHref: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <Headset className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-900">Prioritet dəstək aktivdir</p>
          <p className="text-xs text-emerald-700">Sorğularınız növbədən əvvəl cavablandırılır.</p>
        </div>
      </div>
      <Link
        href={chatHref}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Dəstəyə yaz <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
