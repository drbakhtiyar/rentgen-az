"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string; icon?: React.ReactNode; navKey?: string };

function Count({ n, light }: { n: number; light?: boolean }) {
  if (!n) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
        light ? "bg-white/20 text-white" : "bg-amber-500 text-white",
      )}
    >
      {n}
    </span>
  );
}

export function DashboardNav({
  items,
  mobile,
  badges,
}: {
  items: NavItem[];
  mobile?: boolean;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <>
        {items.map((item) => {
          const active = pathname === item.href;
          const n = badges?.[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium",
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200",
              )}
            >
              {item.label}
              {n > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-ink-900",
            )}
          >
            {item.icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>}
            {item.label}
            <Count n={badges?.[item.href] ?? 0} light={active} />
          </Link>
        );
      })}
    </nav>
  );
}
