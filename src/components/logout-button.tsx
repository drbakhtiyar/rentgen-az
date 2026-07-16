"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/giris/actions";

export function LogoutButton({
  className,
  label = "Çıxış",
  collapsible = false,
}: {
  className?: string;
  label?: string;
  /** Hide the label until the collapsed sidebar is hovered. */
  collapsible?: boolean;
}) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        }
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className={collapsible ? "hidden whitespace-nowrap group-hover:inline" : ""}>{label}</span>
      </button>
    </form>
  );
}
