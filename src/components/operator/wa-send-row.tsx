"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { sendWaInviteAction } from "@/app/panel/actions";

/**
 * 2026-08-12: wa.me açmır — dəvət PLATFORMA NÖMRƏSİNDƏN Meta şablonu ilə
 * gedir (sendWaInviteAction). Mərkəz cavab yazanda söhbəti bot aparır.
 */
export function WaSendRow({
  centerId,
  name,
  city,
  status,
  waPhone,
  reviews,
  note,
  kind = "price",
  reason,
}: {
  centerId: string;
  name: string;
  city: string | null;
  status: string;
  waPhone: string;
  /** Köhnə wa.me linki — artıq istifadə olunmur, uyğunluq üçün qalıb. */
  waUrl?: string;
  reviews: number | null;
  note?: string;
  kind?: "price" | "faq" | "card" | "cabinet";
  reason?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function go() {
    setPending(true);
    setError(null);
    const res = await sendWaInviteAction(centerId, kind);
    setPending(false);
    if (res.ok) {
      setSent(true);
      router.refresh();
    } else {
      setError(res.error ?? "Xəta");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink-900">{name}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {[city, waPhone, status === "APPROVED" ? "canlı" : "gözləmədə", reviews ? `${reviews} Google rəyi` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {reason && (
          <p className="mt-1 text-[11px] font-medium text-brand-600">↳ {reason}</p>
        )}
        {note && (
          <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
            {note}
          </span>
        )}
        {error && (
          <span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
            {error}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={go}
        disabled={pending || sent}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5b] disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sent ? "Göndərildi ✓" : "Dəvət göndər"}
      </button>
    </div>
  );
}
