"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string; icon?: React.ReactNode };

export function DashboardNav({
  items,
  mobile,
}: {
  items: NavItem[];
  mobile?: boolean;
}) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium",
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200",
              )}
            >
              {item.label}
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
          </Link>
        );
      })}
    </nav>
  );
}
