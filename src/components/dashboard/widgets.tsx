import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "brand" | "green" | "amber" | "cyan" | "slate";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    cyan: "bg-cyan-50 text-cyan-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg [&>svg]:h-5 [&>svg]:w-5", tones[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="font-display mt-2 text-3xl font-bold text-ink-900">{value}</p>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-10 text-center">
      {icon && (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </span>
      )}
      <h3 className="font-display mt-4 text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </Card>
  );
}

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Gözləmədə", cls: "bg-amber-50 text-amber-700 ring-amber-100" },
  APPROVED: { label: "Təsdiqlənib", cls: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  DEACTIVATED: { label: "Deaktiv", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  NEW: { label: "Yeni", cls: "bg-brand-50 text-brand-700 ring-brand-100" },
  CONTACTED: { label: "Əlaqə saxlanılıb", cls: "bg-cyan-50 text-cyan-700 ring-cyan-100" },
  COMPLETED: { label: "Tamamlanıb", cls: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  CANCELLED: { label: "Ləğv edilib", cls: "bg-red-50 text-red-700 ring-red-100" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, cls: "bg-slate-100 text-slate-600 ring-slate-200" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", s.cls)}>
      {s.label}
    </span>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display font-bold text-ink-900">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </Card>
  );
}
