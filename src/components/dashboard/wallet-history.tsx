import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatManat } from "@/lib/plans";
import { formatDateAz } from "@/lib/utils";

type Entry = { id: string; amount: number; type: string; note: string | null; createdAt: Date };

const TYPE_LABEL: Record<string, string> = {
  TOPUP: "Balans artırma",
  PLAN: "Paket alışı",
  REFUND: "Geri qaytarma",
  ADMIN: "Admin düzəlişi",
};

export function WalletHistory({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">Hələ heç bir hərəkət yoxdur.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {entries.map((e) => {
        const positive = e.amount >= 0;
        return (
          <li key={e.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
              >
                {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {e.note || TYPE_LABEL[e.type] || e.type}
                </p>
                <p className="text-xs text-slate-400">{formatDateAz(e.createdAt)}</p>
              </div>
            </div>
            <span className={`shrink-0 text-sm font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
              {positive ? "+" : "−"}
              {formatManat(Math.abs(e.amount))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
