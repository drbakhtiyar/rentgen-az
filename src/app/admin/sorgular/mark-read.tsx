"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { markContactReadAction } from "./actions";

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markContactReadAction(id);
          router.refresh();
        })
      }
      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100 disabled:opacity-50"
    >
      <Check className="h-3.5 w-3.5" /> Oxundu
    </button>
  );
}
