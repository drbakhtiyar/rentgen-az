"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Reply, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { replyToReviewAction } from "@/app/merkez/actions";

export function ReviewReplyForm({
  reviewId,
  defaultReply,
}: {
  reviewId: string;
  defaultReply?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState(defaultReply ?? "");
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    startTransition(async () => {
      const res = await replyToReviewAction(reviewId, value);
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rəyə cavabınız…"
        className="min-h-[60px]"
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />}
          {defaultReply ? "Cavabı yenilə" : "Cavab yaz"}
        </Button>
        {done && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Saxlanıldı
          </span>
        )}
      </div>
    </form>
  );
}
