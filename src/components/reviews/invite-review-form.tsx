"use client";

import * as React from "react";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Textarea, Field } from "@/components/ui/field";
import { RatingQuestions, EMPTY_SCORES } from "@/components/reviews/rating-questions";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { submitInviteReviewAction, type InviteScores } from "@/app/rey/davet/actions";

/**
 * Dəvət linki ilə gələn pasiyent üçün rəy forması.
 *
 * QR formasından fərqi: ad/soyad/telefon SORUŞULMUR və OTP YOXDUR — linki
 * pasiyentin öz nömrəsinə biz göndərmişik, kim olduğunu artıq bilirik.
 * Yalnız ulduzlar + istəyə bağlı şərh → bir ekran, bir toxunuş.
 */
export function InviteReviewForm({
  token,
  centerSlug,
  defaultScores,
  defaultComment,
  locale = DEFAULT_LOCALE,
}: {
  token: string;
  centerSlug: string;
  defaultScores?: InviteScores;
  defaultComment?: string;
  locale?: Locale;
}) {
  const t = getDict(locale).reviews;
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState(defaultComment ?? "");
  const [scores, setScores] = React.useState<InviteScores>(defaultScores ?? EMPTY_SCORES);

  function setScore(key: keyof InviteScores, v: number) {
    setScores((s) => ({ ...s, [key]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (Object.values(scores).some((v) => !v)) {
      setError(t.allStars);
      return;
    }
    startTransition(async () => {
      const res = await submitInviteReviewAction({ token, scores, comment });
      if (!res.ok) setError(res.error ?? t.errGeneric);
      else setDone(res.message ?? null);
    });
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <p className="mt-4 text-base font-semibold text-ink-900">{done}</p>
        <ButtonLink href={`/rentgen-merkezleri/${centerSlug}`} className="mt-6">
          {t.gotoCenter}
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <RatingQuestions scores={scores} onChange={setScore} locale={locale} />

      <Field label={t.reviewLabel} htmlFor="comment">
        <Textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.commentPlaceholder}
          maxLength={1000}
        />
      </Field>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.send}
      </Button>

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        {t.inviteVerifiedNote}
      </p>
    </form>
  );
}
