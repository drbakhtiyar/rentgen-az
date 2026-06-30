"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/giris/actions";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        }
      >
        <LogOut className="h-4 w-4" />
        Çıxış
      </button>
    </form>
  );
}
