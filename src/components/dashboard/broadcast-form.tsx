"use client";

import * as React from "react";
import { Loader2, Megaphone, CheckCircle2 } from "lucide-react";
import { broadcastToPartnerDoctorsAction } from "@/app/merkez/actions";

export function BroadcastForm() {
  const [text, setText] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    startTransition(async () => {
      const res = await broadcastToPartnerDoctorsAction(text);
      if (!res.ok) return setError(res.error ?? "Xəta baş verdi");
      setMsg(res.message ?? "Göndərildi.");
      setText("");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-slate-600">
        <Megaphone className="h-4 w-4 text-brand-600" />
        Bütün təsdiqlənmiş partnyor həkimlərinizə bir mesaj göndərin.
      </p>
      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Məsələn: Bu həftə CBCT xidmətində 20% endirim..."
        className="min-h-[90px] w-full rounded-xl border border-slate-200 p-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending || text.trim().length < 2}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
        Toplu mesaj göndər
      </button>
    </form>
  );
}
