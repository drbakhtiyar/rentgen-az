"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Loader2, CheckCircle2, ImagePlus, X } from "lucide-react";
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
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasExisting = Object.values(defaultScores ?? {}).some((v) => (v ?? 0) > 0);
  const ru = locale === "ru";

  function setScore(key: keyof Scores, v: number) {
    setScores((s) => ({ ...s, [key]: v }));
  }

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, 4 - photos.length)) {
        const blob = await upload(`review-photos/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        uploaded.push(blob.url);
      }
      setPhotos((prev) => [...prev, ...uploaded].slice(0, 4));
    } catch {
      setError(ru ? "Фото не загрузилось." : "Şəkil yüklənmədi.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (Object.values(scores).some((v) => v < 1)) {
      setError(t.allStars);
      return;
    }
    startTransition(async () => {
      const res = await submitReviewAction({ centerId, ...scores, comment, photos });
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

      {/* Photos */}
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((p) => (
          <span key={p} className="group relative h-16 w-16 overflow-hidden rounded-lg ring-1 ring-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setPhotos((prev) => prev.filter((x) => x !== p))}
              className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Sil"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {photos.length < 4 && (
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPickPhotos} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-brand-300 hover:text-brand-500 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            </button>
          </>
        )}
      </div>

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
