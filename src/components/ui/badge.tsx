import * as React from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "green" | "amber" | "slate" | "red" | "cyan";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  red: "bg-red-50 text-red-700 ring-red-100",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge tone="brand" className={cn("gap-1", className)}>
      <BadgeCheck className="h-3.5 w-3.5" />
      Təsdiqlənmiş
    </Badge>
  );
}
