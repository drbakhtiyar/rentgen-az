"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { markServiceReceivedAction } from "@/app/kabinet/actions";

export function MarkReceivedButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function mark() {
    startTransition(async () => {
      await markServiceReceivedAction(requestId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={mark}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      Xidmət aldım
    </button>
  );
}
