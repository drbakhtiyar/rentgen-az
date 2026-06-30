import Link from "next/link";
import { ScanLine } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { DashboardNav, type NavItem } from "./nav";

export function DashboardShell({
  title,
  roleLabel,
  userName,
  nav,
  children,
}: {
  title: string;
  roleLabel: string;
  userName: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 px-2 pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900">
                <ScanLine className="h-4 w-4 text-cyan-400" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink-900">{roleLabel}</p>
                <p className="max-w-[150px] truncate text-xs text-slate-500">{userName}</p>
              </div>
            </div>
            <DashboardNav items={nav} />
            <div className="mt-3 border-t border-slate-100 pt-3">
              <Link
                href="/"
                className="block rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
              >
                ← Sayta qayıt
              </Link>
              <LogoutButton className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50" />
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
          </div>

          {/* Mobile nav */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <DashboardNav items={nav} mobile />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
