"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { markWaSentAction } from "@/app/panel/actions";

/**
 * Bir mərkəz üçün "WhatsApp aç" düyməsi: əvvəl göndərişi jurnala yazır
 * (kvota sayğacı), sonra wa.me linkini yeni pəncərədə açır — mesaj artıq
 * hazır yazılıb, operator yalnız "göndər"ə basır.
 */
export function WaSendRow({
  centerId,
  name,
  city,
  status,
  waPhone,
  waUrl,
  reviews,
}: {
  centerId: string;
  name: string;
  city: string | null;
  status: string;
  waPhone: string;
  waUrl: string;
  reviews: number | null;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function go() {
    setPending(true);
    const res = await markWaSentAction(centerId);
    setPending(false);
    if (res.ok) {
      setSent(true);
      window.open(waUrl, "_blank", "noopener");
      router.refresh();
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
      </div>
      <button
        type="button"
        onClick={go}
        disabled={pending || sent}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5b] disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        {sent ? "Göndərildi ✓" : "WhatsApp aç"}
      </button>
    </div>
  );
}
