"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Check, X, Clock } from "lucide-react";
import {
  requestPartnershipAction,
  respondPartnershipAction,
  respondWorkplaceAction,
} from "@/app/actions/partnership";

/** Doctor-side: send a partnership request to a center (state by status). */
export function RequestPartnerButton({
  centerId,
  status,
}: {
  centerId: string;
  /** current partnership status for this center, or null if none */
  status: "PENDING" | "ACCEPTED" | "REJECTED" | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  if (status === "ACCEPTED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <Check className="h-3.5 w-3.5" /> Partnyor
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5" /> Gözləyir
      </span>
    );
  }

  function send() {
    startTransition(async () => {
      await requestPartnershipAction(centerId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={send}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      {status === "REJECTED" ? "Yenidən sorğu" : "Əməkdaşlıq sorğusu"}
    </button>
  );
}

/** Center-side: confirm / reject a doctor's "works here" claim. */
export function RespondWorkplaceButtons({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function respond(accept: boolean) {
    startTransition(async () => {
      await respondWorkplaceAction(doctorId, accept);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      <button
        type="button"
        disabled={pending}
        onClick={() => respond(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> Təsdiqlə
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => respond(false)}
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" /> Rədd et
      </button>
    </div>
  );
}

/** Center-side: accept / reject an incoming partnership request. */
export function RespondPartnerButtons({ partnerId }: { partnerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function respond(accept: boolean) {
    startTransition(async () => {
      await respondPartnershipAction(partnerId, accept);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      <button
        type="button"
        disabled={pending}
        onClick={() => respond(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> Qəbul et
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => respond(false)}
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" /> Rədd et
      </button>
    </div>
  );
}
