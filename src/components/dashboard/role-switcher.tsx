"use client";

import { Repeat } from "lucide-react";
import { switchRoleAction } from "@/app/giris/actions";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  PATIENT: "Pasiyent",
  CENTER: "Mərkəz",
  DOCTOR: "Həkim",
};

export function RoleSwitcher({
  roles,
  current,
}: {
  roles: ("PATIENT" | "CENTER" | "DOCTOR")[];
  current: string;
}) {
  if (roles.length < 2) return null;

  return (
    <div className="mb-3 rounded-xl bg-slate-50 p-2">
      <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Repeat className="h-3 w-3" /> Rolu dəyiş
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
