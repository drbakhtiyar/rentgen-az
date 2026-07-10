"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import {
  RatingQuestions,
  EMPTY_SCORES,
  type Scores,
} from "@/components/reviews/rating-questions";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { submitReviewAction } from "@/app/kabinet/actions";

export function ReviewForm({
  centerId,
  centerName,
  defaultScores,
  defaultComment,
  compact,
  locale = DEFAULT_LOCALE,
}: {
  centerId: string;
  centerName?: string;
  defaultScores?: Partial<Scores>;
  defaultComment?: string;
  compact?: boolean;
  locale?: Locale;
}) {
  const t = getDict(locale).reviews;
  const router = useRouter();
  const [scores, setScores] = React.useState<Scores>({
    ...EMPTY_SCORES,
    ...defaultScores,
  });
  const [comment, setComment] = React.useState(defaultComment ?? "");
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasExisting = Object.values(defaultScores ?? {}).some((v) => (v ?? 0) > 0);

  function setScore(key: keyof Scores, v: number) {
    setScores((s) => ({ ...s, [key]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (Object.values(scores).some((v) => v < 1)) {
      setError(t.allStars);
      return;
    }
    startTransition(async () => {
      const res = await submitReviewAction({ centerId, ...scores, comment });
      if (!res.ok) {
        setError(res.error ?? t.errGeneric);
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-5 w-5" /> {t.thanks}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {centerName && !compact && (
        <p className="text-sm text-slate-500">
          {t.centerLabel}: <span className="font-semibold text-ink-800">{centerName}</span>
        </p>
      )}
      <RatingQuestions scores={scores} onChange={setScore} locale={locale} />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t.commentPlaceholder}
        className="min-h-[80px]"
      />
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {hasExisting ? t.updateReview : t.writeReview}
      </Button>
    </form>
  );
}
