"use client";

import * as React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveFaqAction } from "@/app/f/[token]/actions";

type Question = { key: string; text: string; hint?: string };

/** Girişsiz FAQ formu — 10 sabit sual, hər biri qısa mətn cavabı. */
export function QuickFaqForm({
  token,
  questions,
  initial,
}: {
  token: string;
  questions: Question[];
  initial: Record<string, string>;
}) {
  const [values, setValues] = React.useState<Record<string, string>>(initial);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<number | null>(null);

  const answered = questions.filter((q) => (values[q.key] ?? "").trim()).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveFaqAction({ token, answers: values });
      if (!res.ok) setError(res.error ?? "Xəta");
      else setDone(res.saved ?? 0);
    });
  }

  if (done != null) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <p className="mt-4 text-base font-semibold text-ink-900">
          Təşəkkürlər! {done} sualın cavabı yadda saxlanıldı.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Cavablar səhifənizdə dərhal görünür. Sonradan dəyişmək üçün eyni linkdən
          istifadə edə bilərsiniz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-xl bg-brand-50 px-4 py-2.5 text-center text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
        {answered} / {questions.length} sual cavablanıb
      </p>

      {questions.map((q, i) => (
        <label key={q.key} className="block rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <span className="flex items-start gap-2 text-sm font-medium text-ink-900">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
              {i + 1}
            </span>
            {q.text}
          </span>
          <textarea
            rows={2}
            maxLength={500}
            value={values[q.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [q.key]: e.target.value }))}
            placeholder={q.hint ?? "Cavabınızı yazın…"}
            className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500"
          />
        </label>
      ))}

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yadda saxla"}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Bilmədiyiniz sualı boş buraxın — yalnız doldurduqlarınız yazılır, köhnə
        cavablar itmir.
      </p>
    </form>
  );
}
