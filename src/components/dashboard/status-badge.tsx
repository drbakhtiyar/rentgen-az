"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

const CLS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  DEACTIVATED: "bg-slate-100 text-slate-600 ring-slate-200",
  NEW: "bg-brand-50 text-brand-700 ring-brand-100",
  CONTACTED: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  CANCELLED: "bg-red-50 text-red-700 ring-red-100",
};

export function StatusBadge({ status }: { status: string }) {
  const labels = getPanelDict(useLocale()).status as Record<string, string>;
  const cls = CLS[status] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", cls)}>
      {labels[status] ?? status}
    </span>
  );
}
