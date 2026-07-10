"use client";

import * as React from "react";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { RatingQuestions, EMPTY_SCORES } from "@/components/reviews/rating-questions";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import {
  requestReviewOtpAction,
  submitQrReviewAction,
  type QrScores,
} from "@/app/rey/actions";

type Option = { value: string; label: string };

const MANUAL = "__manual__";

export function QrReviewForm({
  centerSlug,
  centerName,
  doctors,
  locale = DEFAULT_LOCALE,
}: {
  centerSlug: string;
  centerName: string;
  doctors: Option[];
  locale?: Locale;
}) {
  const t = getDict(locale).reviews;
  const [step, setStep] = React.useState<"form" | "otp">("form");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [doctorSel, setDoctorSel] = React.useState("");
  const [doctorName, setDoctorName] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [scores, setScores] = React.useState<QrScores>(EMPTY_SCORES);
  const [code, setCode] = React.useState("");

  function setScore(key: keyof QrScores, v: number) {
    setScores((s) => ({ ...s, [key]: v }));
  }

  function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError(t.errName);
      return;
    }
    if (!phone.trim()) {
      setError(t.errPhone);
      return;
    }
    if (Object.values(scores).some((v) => v < 1)) {
      setError(t.allStars);
      return;
    }
    startTransition(async () => {
      const res = await requestReviewOtpAction({ phone: phone.trim() });
      if (!res.ok) {
        setError(res.error ?? t.errGeneric);
        return;
      }
      setDevCode(res.devCode ?? null);
      setStep("otp");
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitQrReviewAction({
        centerSlug,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        code: code.trim(),
        doctorId: doctorSel && doctorSel !== MANUAL ? doctorSel : undefined,
        doctorName: doctorSel === MANUAL ? doctorName.trim() : undefined,
        scores,
        comment: comment.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? t.errGeneric);
        return;
      }
      setDone(res.message ?? t.thanks);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <p className="mt-4 text-lg font-semibold text-emerald-800">{done}</p>
        <ButtonLink href={`/rentgen-merkezleri/${centerSlug}`} className="mt-6">
          {t.gotoCenter}
        </ButtonLink>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
          <ShieldCheck className="mb-1 h-5 w-5 text-brand-600" />
          {t.otpSentPre}
          <span className="font-semibold">{phone}</span>
          {t.otpSentPost}
        </div>
        {devCode && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t.otpTestMode}<span className="font-bold">{devCode}</span>
          </p>
        )}
        <Field label={t.otpLabel} htmlFor="code" required>
          <Input
            id="code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.otpPlaceholder}
            autoFocus
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={pending || code.trim().length < 4}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t.send}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setError(null);
            }}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            {t.back}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="space-y-5">
      <p className="text-sm text-slate-500">
        {t.centerLabel}: <span className="font-semibold text-ink-800">{centerName}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.firstName} htmlFor="firstName" required>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t.firstNamePh} required />
        </Field>
        <Field label={t.lastName} htmlFor="lastName" required>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t.lastNamePh} required />
        </Field>
      </div>
      <Field label={t.phoneLabel} htmlFor="phone" required hint={t.phoneHint}>
        <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePlaceholder} required />
      </Field>

      <Field label={t.doctorLabel} htmlFor="doctor" hint={t.doctorHint}>
        <Select id="doctor" value={doctorSel} onChange={(e) => setDoctorSel(e.target.value)}>
          <option value="">{t.doctorNone}</option>
          {doctors.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
          <option value={MANUAL}>{t.doctorOther}</option>
        </Select>
      </Field>
      {doctorSel === MANUAL && (
        <Field label={t.doctorNameLabel} htmlFor="doctorName">
          <Input id="doctorName" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder={t.doctorNamePh} />
        </Field>
      )}

      <RatingQuestions scores={scores} onChange={setScore} locale={locale} />

      <Field label={t.reviewLabel} htmlFor="comment">
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.commentPlaceholder}
          className="min-h-[90px]"
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {t.submitOtp}
      </Button>
    </form>
  );
}
