"use client";

import * as React from "react";
import { Loader2, Send, Check } from "lucide-react";
import { sendRecallSmsAction } from "./actions";

/** Send a "come back" SMS to a patient (re-call). */
export function RecallButton({ phone, name }: { phone: string; name: string }) {
  const [state, setState] = React.useState<"idle" | "busy" | "done" | "error">("idle");

  async function send() {
    if (state === "busy" || state === "done") return;
    if (!confirm(`${name} nömrəsinə təkrar dəvət SMS-i göndərilsin?`)) return;
    setState("busy");
    const res = await sendRecallSmsAction({ phone, name });
    setState(res.ok ? "done" : "error");
  }

  return (
    <button
      type="button"
      onClick={send}
      disabled={state === "busy" || state === "done"}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        state === "done"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
      }`}
      title="Təkrar çağırış SMS-i göndər"
    >
      {state === "busy" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-3 w-3" />
      ) : (
        <Send className="h-3 w-3" />
      )}
      {state === "done" ? "Göndərildi" : "Çağır"}
    </button>
  );
}
