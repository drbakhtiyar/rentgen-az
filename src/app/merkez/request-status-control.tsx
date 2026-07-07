"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, CheckCircle2, XCircle, Check } from "lucide-react";
import { updateRequestStatusAction } from "./actions";
import type { RequestStatus } from "@/generated/prisma/enums";

/**
 * One-way status buttons for a request. Clicking advances the work to the next
 * stage — no dropdown, no going back, no re-clicking (so no repeated SMS).
 * "Yeni" is only the initial label. COMPLETED/CANCELLED lock the request.
 */
export function RequestStatusControl({
  id,
  status,
  patientUpdated = false,
}: {
  id: string;
  status: RequestStatus;
  patientUpdated?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function go(next: RequestStatus) {
    startTransition(async () => {
      await updateRequestStatusAction(id, next);
      router.refresh();
    });
  }

  // Terminal states: locked, just a badge.
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Tamamlanıb
      </span>
    );
  }
  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
        <XCircle className="h-3.5 w-3.5" /> Ləğv edilib
      </span>
    );
  }

  const contacted = status === "CONTACTED";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}

      {/* Stage badge */}
      {contacted ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
          <Check className="h-3.5 w-3.5" /> Əlaqə saxlanılıb
        </span>
      ) : patientUpdated ? (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          Yenilənib
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          Yeni
        </span>
      )}

      {/* Contact button — only before contacting (re-appears if patient updated) */}
      {!contacted && (
        <button
          type="button"
          disabled={pending}
          onClick={() => go("CONTACTED")}
          className="inline-flex items-center gap-1.5 rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          <Phone className="h-3.5 w-3.5" /> Əlaqə saxlanıldı
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => go("COMPLETED")}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Tamamlandı
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => go("CANCELLED")}
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" /> Ləğv et
      </button>
    </div>
  );
}
