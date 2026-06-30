"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toggleFavoriteAction } from "@/app/kabinet/actions";

export function FavoriteRemoveButton({ centerId }: { centerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function remove() {
    startTransition(async () => {
      await toggleFavoriteAction(centerId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5 fill-current" />}
      Sil
    </button>
  );
}
