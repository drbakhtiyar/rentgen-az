"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export type Scores = {
  service: number;
  staff: number;
  clean: number;
  wait: number;
  price: number;
};

export const RATING_KEYS: (keyof Scores)[] = ["service", "staff", "clean", "wait", "price"];

export const EMPTY_SCORES: Scores = {
  service: 0,
  staff: 0,
  clean: 0,
  wait: 0,
  price: 0,
};

/** The 5-question star block, shared by the QR and cabinet review forms. */
export function RatingQuestions({
  scores,
  onChange,
  locale = DEFAULT_LOCALE,
}: {
  scores: Scores;
  onChange: (key: keyof Scores, value: number) => void;
  locale?: Locale;
}) {
  const t = getDict(locale).reviews;
  const labels: Record<keyof Scores, string> = {
    service: t.qService,
    staff: t.qStaff,
    clean: t.qClean,
    wait: t.qWait,
    price: t.qPrice,
  };
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-ink-900">{t.ratingTitle}</p>
      <div className="space-y-3">
        {RATING_KEYS.map((key) => (
          <StarQuestion
            key={key}
            label={labels[key]}
            starSuffix={t.starSuffix}
            value={scores[key]}
            onChange={(v) => onChange(key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function StarQuestion({
  label,
  starSuffix,
  value,
  onChange,
}: {
  label: string;
  starSuffix: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1.5 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i}${starSuffix}`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                i <= (hover || value)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200 hover:text-amber-200",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
