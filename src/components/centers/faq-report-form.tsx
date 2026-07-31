"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { submitContentReportAction } from "@/app/actions/report";
import type { Locale } from "@/lib/i18n";

const T = {
  az: {
    trigger: "Məlumat düzgün deyil? Bizə bildirin.",
    name: "Ad (istəyə bağlı)",
    email: "E-mail (istəyə bağlı)",
    problem: "Problem nədir?",
    problemPh: "Hansı məlumat yanlışdır?",
    send: "Göndər",
    sending: "Göndərilir…",
    thanks: "Təşəkkürlər! Bildirişiniz göndərildi.",
    cancel: "Bağla",
  },
  ru: {
    trigger: "Информация неверна? Сообщите нам.",
    name: "Имя (необязательно)",
    email: "E-mail (необязательно)",
    problem: "В чём проблема?",
    problemPh: "Какая информация неверна?",
    send: "Отправить",
    sending: "Отправка…",
    thanks: "Спасибо! Ваше сообщение отправлено.",
    cancel: "Закрыть",
  },
};

export function FaqReportForm({
  centerId,
  locale = "az",
}: {
  centerId: string;
  locale?: Locale;
}) {
  const t = T[locale === "ru" ? "ru" : "az"];
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitContentReportAction({
        centerId,
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        message: String(fd.get("message") ?? ""),
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" /> {t.thanks}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 underline-offset-2 hover:text-brand-600 hover:underline"
      >
        <AlertCircle className="h-3.5 w-3.5" /> {t.trigger}
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input
          name="name"
          placeholder={t.name}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <input
          name="email"
          type="email"
          placeholder={t.email}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
      </div>
      <textarea
        name="message"
        required
        rows={3}
        placeholder={t.problemPh}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? t.sending : t.send}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-slate-500 hover:text-ink-800"
        >
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
