"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Loader2, ArrowRight, Stethoscope } from "lucide-react";
import { suggestServicesForSymptom, type SymptomSuggestion } from "@/app/actions/symptom";

export function SymptomSuggest({ ru }: { ru: boolean }) {
  const [q, setQ] = React.useState("");
  const [res, setRes] = React.useState<SymptomSuggestion[] | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    startTransition(async () => {
      setRes(await suggestServicesForSymptom(q));
    });
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5 sm:p-6">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Sparkles className="h-4 w-4 text-brand-600" />
        {ru ? "Не знаете, какое обследование нужно?" : "Hansı müayinə lazımdır bilmirsiniz?"}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {ru
          ? "Опишите жалобу — подскажем подходящую услугу."
          : "Şikayətinizi yazın — uyğun xidməti təklif edək."}
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ru ? "Напр.: имплант, боль в зубе, брекеты…" : "Məs: implant, diş ağrısı, breket…"}
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4" />}
          {ru ? "Подсказать" : "Təklif et"}
        </button>
      </form>

      {res && (
        <div className="mt-4">
          {res.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {res.map((s) => (
                <Link
                  key={s.slug}
                  href={`/xidmetler/${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-brand-100 hover:bg-brand-50"
                >
                  {s.name} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {ru
                ? "Не нашли подходящее — уточните запрос или свяжитесь с центром."
                : "Uyğun tapılmadı — sorğunu dəqiqləşdirin və ya mərkəzlə əlaqə saxlayın."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
