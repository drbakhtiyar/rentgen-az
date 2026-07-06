"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import {
  setReviewHiddenAction,
  approveReviewAction,
  rejectReviewAction,
} from "@/app/admin/actions";

export function ReviewHideToggle({
  reviewId,
  hidden,
}: {
  reviewId: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function toggle() {
    startTransition(async () => {
      await setReviewHiddenAction(reviewId, !hidden);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        hidden
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : hidden ? (
        <Eye className="h-3.5 w-3.5" />
      ) : (
        <EyeOff className="h-3.5 w-3.5" />
      )}
      {hidden ? "Göstər" : "Gizlət"}
    </button>
  );
}

/** Approve / reject buttons for a flagged review awaiting moderation. */
export function ReviewModerationButtons({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => approveReviewAction(reviewId))}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> Təsdiqlə
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => rejectReviewAction(reviewId))}
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" /> Gizli saxla
      </button>
    </div>
  );
}
