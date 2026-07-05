"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { cancelRequestAction } from "@/app/kabinet/actions";

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function cancel() {
    if (!window.confirm("Müraciəti ləğv etmək istədiyinizə əminsiniz?")) return;
    startTransition(async () => {
      await cancelRequestAction(requestId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={cancel}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
      Ləğv et
    </button>
  );
}
