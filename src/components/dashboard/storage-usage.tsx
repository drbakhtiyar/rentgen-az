import { HardDrive, AlertTriangle } from "lucide-react";
import { centerLimits, PLAN_LABEL, STORAGE_WARN_PCT } from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";

const GB = 1024 ** 3;

function fmtBytes(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(bytes >= 10 * GB ? 0 : 1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function fmtLimit(gb: number): string {
  return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;
}

/** Center storage usage bar (used vs plan quota + active +1TB blocks). */
export function StorageUsage({
  usedBytes,
  plan,
  extraGb = 0,
}: {
  usedBytes: number;
  plan: Plan;
  /** Active +1TB overage blocks, in GB (Platinum). */
  extraGb?: number;
}) {
  const limits = centerLimits(plan);
  const limitGb = limits.storageGb + extraGb;
  const limitBytes = limitGb * GB;
  const pct = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const near = pct >= STORAGE_WARN_PCT;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
          <HardDrive className="h-4 w-4 text-brand-600" /> Fayl saxlama
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {PLAN_LABEL[plan]}
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${near ? "bg-amber-500" : "bg-brand-500"}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-slate-600">
        <span className="font-semibold text-ink-900">{fmtBytes(usedBytes)}</span> / {fmtLimit(limitGb)}{" "}
        <span className="text-slate-400">({pct}%)</span>
        {extraGb > 0 && (
          <span className="ml-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            +{extraGb / 1024} TB blok
          </span>
        )}
      </p>

      {near && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {limits.storageOverage
            ? "Yaddaşınız dolur — əlavə yaddaş alın (hər 1 TB +29 ₼)."
            : "Yaddaşınız dolur — köhnə faylları silin və ya paketi yüksəldin."}
        </p>
      )}
    </div>
  );
}
