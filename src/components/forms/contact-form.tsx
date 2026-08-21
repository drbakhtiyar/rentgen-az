"use client";

/**
 * «Sorğu göndərin» forması (2026-08-22) — analizler.az versiyasının rentgen
 * portu: Ad+Telefon yanaşı, Mövzu seçimi, Qeyd; göndərmə OTP təsdiqi ilə
 * 2 addımda gedir. Uğur/kod ekranları da eyni axındadır.
 */
import * as React from "react";
import { Send, Loader2, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import {
  requestContactOtp,
  confirmContactOtp,
  type ContactInput,
} from "@/app/elaqe/contact-actions";

const CONTACT_SUBJECTS_AZ = [
  "Ümumi sual",
  "Mərkəz kimi əməkdaşlıq",
  "Həkim kimi qoşulmaq",
  "Qiymət düzəlişi / yeniləmə",
  "Səhv məlumat bildirmək",
  "Texniki problem",
  "Digər",
];
const CONTACT_SUBJECTS_RU = [
  "Общий вопрос",
  "Сотрудничество (центр)",
  "Присоединиться как врач",
  "Исправление / обновление цен",
  "Сообщить об ошибке",
  "Техническая проблема",
  "Другое",
];

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-slate-400 focus:border-iris-veil focus:ring-2 focus:ring-iris-veil/20";
const label = "block text-sm font-medium text-ink-800";

export function ContactForm({ ru = false }: { ru?: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<ContactInput | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");

  const subjects = ru ? CONTACT_SUBJECTS_RU : CONTACT_SUBJECTS_AZ;
  const t = ru
    ? {
        name: "Имя, фамилия",
        namePh: "Ваше имя",
        phone: "Номер телефона",
        subject: "Тема",
        subjectPh: "Выберите тему",
        message: "Примечание",
        messagePh: "Дополнительная информация (необязательно)",
        note: "Ваш запрос попадёт к нашей команде. Оплата на платформе не взимается.",
        submitOtp: "Продолжить — получить код",
        codeTitle: "Подтвердите номер",
        codeLead: (p: string) => `Мы отправили 6-значный код на номер ${p}. Введите его ниже.`,
        codeLabel: "Код подтверждения",
        confirm: "Подтвердить и отправить",
        back: "Изменить данные",
        devHint: (c: string) => `Тестовый режим: код — ${c}`,
        okTitle: "Запрос отправлен",
        okText: "Спасибо! Мы свяжемся с вами в ближайшее время.",
        again: "Отправить ещё один",
      }
    : {
        name: "Ad, Soyad",
        namePh: "Adınız",
        phone: "Telefon nömrəsi",
        subject: "Mövzu",
        subjectPh: "Mövzunu seçin",
        message: "Qeyd",
        messagePh: "Əlavə məlumat (istəyə bağlı)",
        note: "Sorğunuz komandamıza çatdırılır. Platformada ödəniş alınmır.",
        submitOtp: "Davam et — təsdiq kodu al",
        codeTitle: "Nömrəni təsdiqləyin",
        codeLead: (p: string) => `${p} nömrəsinə 6 rəqəmli kod göndərdik. Onu aşağıda yazın.`,
        codeLabel: "Təsdiq kodu",
        confirm: "Təsdiqlə və göndər",
        back: "Məlumatları dəyiş",
        devHint: (c: string) => `Test rejimi: kod — ${c}`,
        okTitle: "Sorğu göndərildi",
        okText: "Təşəkkür edirik! Ən qısa zamanda sizinlə əlaqə saxlayacağıq.",
        again: "Yeni sorğu göndər",
      };

  const requiredMsg = ru ? "Заполните это поле." : "Bu xananı doldurun.";
  const onInvalidReq = (
    e: React.FormEvent<HTMLInputElement | HTMLSelectElement>,
  ) => e.currentTarget.setCustomValidity(requiredMsg);
  const clearValidity = (
    e: React.FormEvent<HTMLInputElement | HTMLSelectElement>,
  ) => e.currentTarget.setCustomValidity("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const input: ContactInput = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
    };
    setError(null);
    setBusy(true);
    const res = await requestContactOtp(input);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setPending({ ...input, phone: res.phone });
    setDevCode(res.devCode ?? null);
    setCode("");
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !pending) return;
    setError(null);
    setBusy(true);
    const res = await confirmContactOtp({ ...pending, code });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setPending(null);
    setDevCode(null);
    setDone(true);
  }

  if (done) {
    return (
      <div className="py-6 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h3 className="mt-4 text-xl font-bold text-ink-900">{t.okTitle}</h3>
        <p className="mt-2 text-sm text-slate-600">{t.okText}</p>
        <button
          type="button"
          onClick={() => { setDone(false); setError(null); }}
          className="mt-6 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:border-iris-veil hover:text-iris-pulse"
        >
          {t.again}
        </button>
      </div>
    );
  }

  if (pending) {
    return (
      <div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-iris-glow/10 text-iris-pulse">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </span>
        <h3 className="mt-4 text-xl font-bold text-ink-900">{t.codeTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.codeLead(pending.phone)}</p>

        {devCode && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-100">
            {t.devHint(devCode)}
          </p>
        )}

        <form onSubmit={confirm} className="mt-6 space-y-5">
          <div>
            <label className={label} htmlFor="c-code">{t.codeLabel}</label>
            <input
              id="c-code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              onInvalid={onInvalidReq}
              onInput={clearValidity}
              autoFocus
              placeholder="••••••"
              className={`mt-2 text-center text-lg font-semibold tracking-[0.4em] ${field}`}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-iris-pulse px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-iris-glow disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
            {t.confirm}
          </button>

          <button
            type="button"
            onClick={() => { setPending(null); setDevCode(null); setError(null); }}
            className="mx-auto flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-iris-pulse"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.back}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="c-name">
            {t.name} <span className="text-red-500">*</span>
          </label>
          <input id="c-name" name="name" required onInvalid={onInvalidReq} onInput={clearValidity} maxLength={120} placeholder={t.namePh} className={`mt-2 ${field}`} />
        </div>
        <div>
          <label className={label} htmlFor="c-phone">
            {t.phone} <span className="text-red-500">*</span>
          </label>
          <input
            id="c-phone"
            name="phone"
            required
            onInvalid={onInvalidReq}
            onInput={clearValidity}
            inputMode="tel"
            autoComplete="tel"
            placeholder="050 123 45 67"
            className={`mt-2 ${field}`}
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="c-subject">
          {t.subject} <span className="text-red-500">*</span>
        </label>
        <select id="c-subject" name="subject" required onInvalid={onInvalidReq} onInput={clearValidity} defaultValue="" className={`mt-2 ${field}`}>
          <option value="" disabled>{t.subjectPh}</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="c-message">{t.message}</label>
        <textarea
          id="c-message"
          name="message"
          rows={5}
          maxLength={4000}
          placeholder={t.messagePh}
          className={`mt-2 resize-y ${field}`}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-iris-pulse px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-iris-glow disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {t.submitOtp}
      </button>

      <p className="text-center text-xs text-slate-400">{t.note}</p>
    </form>
  );
}
