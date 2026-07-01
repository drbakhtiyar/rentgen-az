"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "@/app/kabinet/actions";

export function ReviewForm({
  centerId,
  centerName,
  defaultRating,
  defaultComment,
  compact,
}: {
  centerId: string;
  centerName?: string;
  defaultRating?: number;
  defaultComment?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = React.useState(defaultRating ?? 0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState(defaultComment ?? "");
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Zəhmət olmasa ulduz seçin.");
      return;
    }
    startTransition(async () => {
      const res = await submitReviewAction({ centerId, rating, comment });
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-5 w-5" /> Rəyiniz üçün təşəkkürlər!
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {centerName && !compact && (
        <p className="text-sm text-slate-500">
          Mərkəz: <span className="font-semibold text-ink-800">{centerName}</span>
        </p>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i} ulduz`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                i <= (hover || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200 hover:text-amber-200",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Təcrübəniz haqqında yazın (istəyə bağlı)"
        className="min-h-[80px]"
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {defaultRating ? "Rəyi yenilə" : "Rəy göndər"}
      </Button>
    </form>
  );
}
