"use client";

import { Repeat } from "lucide-react";
import { switchRoleAction } from "@/app/giris/actions";
import { getPanelDict } from "@/lib/i18n-panel";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function RoleSwitcher({
  roles,
  current,
  locale = "az",
}: {
  roles: ("PATIENT" | "CENTER" | "DOCTOR")[];
  current: string;
  locale?: Locale;
}) {
  if (roles.length < 2) return null;

  const pd = getPanelDict(locale).shell;
  const LABELS: Record<string, string> = {
    PATIENT: pd.rolePatient,
    CENTER: pd.roleCenter,
    DOCTOR: pd.roleDoctor,
  };

  return (
    <div className="mb-3 rounded-xl bg-slate-50 p-2">
      <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Repeat className="h-3 w-3" /> {pd.switchRole}
      </p>
      <div className="grid grid-cols-1 gap-1">
        {roles.map((r) => (
          <form key={r} action={switchRoleAction.bind(null, r)}>
            <button
              type="submit"
              disabled={current === r}
              className={cn(
                "w-full rounded-lg px-2.5 py-1.5 text-left text-sm font-medium transition-colors",
                current === r
                  ? "cursor-default bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-white hover:text-ink-900",
              )}
            >
              {LABELS[r]}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
