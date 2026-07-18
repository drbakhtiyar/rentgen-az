"use client";

import * as React from "react";
import { Loader2, UserPlus, Check } from "lucide-react";
import { invitePatientAction } from "./actions";
import { useLocale } from "@/components/locale-context";
import { getCrmDict } from "@/lib/i18n-crm";

/** Invite a not-in-system patient to register (SMS with a login link). */
export function InviteButton({ phone, name }: { phone: string; name: string }) {
  const t = getCrmDict(useLocale());
  const [state, setState] = React.useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  async function send() {
    if (state === "busy" || state === "done") return;
    if (!confirm(`${name} nömrəsinə sistemə dəvət SMS-i göndərilsin?`)) return;
    setState("busy");
    setError(null);
    const res = await invitePatientAction({ phone, name });
    if (res.ok) {
      setState("done");
    } else {
      setState("error");
      setError(res.error);
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={send}
        disabled={state === "busy" || state === "done"}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          state === "done"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 disabled:opacity-50"
        }`}
        title="Sistemə dəvət SMS-i göndər"
      >
        {state === "busy" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : state === "done" ? (
          <Check className="h-3 w-3" />
        ) : (
          <UserPlus className="h-3 w-3" />
        )}
        {state === "done" ? t.patients.inviteDone : t.patients.invite}
      </button>
      {error && <span className="mt-0.5 text-[10px] text-red-600">{error}</span>}
    </span>
  );
}
