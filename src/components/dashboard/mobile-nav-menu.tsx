"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav";

/** Mobile hamburger menu for the CRM shell — the pill row overflows there. */
export function MobileNavMenu({
  items,
  badges,
  footer,
}: {
  items: NavItem[];
  badges?: Record<string, number>;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const current = items.find((i) => pathname === i.href) ?? items[0];

  // Close when navigating.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menyu"
        className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900"
      >
        {open ? <X className="h-5 w-5 text-slate-500" /> : <Menu className="h-5 w-5 text-slate-500" />}
        {current?.label}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <nav className="space-y-1">
            {items.map((item) => {
              const active = pathname === item.href;
              const n = badges?.[item.href] ?? 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {item.icon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>}
                  {item.label}
                  {n > 0 && (
                    <span
                      className={cn(
                        "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                        active ? "bg-white/20 text-white" : "bg-amber-500 text-white",
                      )}
                    >
                      {n}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          {footer && <div className="mt-1 border-t border-slate-100 pt-1">{footer}</div>}
        </div>
      )}
    </div>
  );
}
