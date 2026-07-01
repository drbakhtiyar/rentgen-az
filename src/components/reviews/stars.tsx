import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating display. */
export function Stars({
  value,
  size = "md",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            dim,
            i <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200",
          )}
        />
      ))}
    </span>
  );
}

export function RatingSummary({
  avg,
  count,
  size = "md",
  className,
}: {
  avg: number;
  count: number;
  size?: "sm" | "md";
  className?: string;
}) {
  if (count === 0) {
    return <span className={cn("text-xs text-slate-400", className)}>Hələ rəy yoxdur</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Stars value={avg} size={size} />
      <span className="text-sm font-semibold text-ink-900">{avg.toFixed(1)}</span>
      <span className="text-xs text-slate-400">({count})</span>
    </span>
  );
}
