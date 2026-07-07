"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type Scores = {
  service: number;
  staff: number;
  clean: number;
  wait: number;
  price: number;
};

export const RATING_QUESTIONS: { key: keyof Scores; label: string }[] = [
  { key: "service", label: "Xidmətin ümumi keyfiyyəti" },
  { key: "staff", label: "Personalın münasibəti" },
  { key: "clean", label: "Təmizlik və rahatlıq" },
  { key: "wait", label: "Gözləmə vaxtı" },
  { key: "price", label: "Qiymət / dəyər nisbəti" },
];

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
}: {
  scores: Scores;
  onChange: (key: keyof Scores, value: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-ink-900">Qiymətləndirmə</p>
      <div className="space-y-3">
        {RATING_QUESTIONS.map((q) => (
          <StarQuestion
            key={q.key}
            label={q.label}
            value={scores[q.key]}
            onChange={(v) => onChange(q.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function StarQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
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
            aria-label={`${i} ulduz`}
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
