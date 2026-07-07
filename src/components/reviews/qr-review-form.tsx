"use client";

import * as React from "react";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { RatingQuestions, EMPTY_SCORES } from "@/components/reviews/rating-questions";
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
}: {
  centerSlug: string;
  centerName: string;
  doctors: Option[];
}) {
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
      setError("Ad və soyadınızı yazın.");
      return;
    }
    if (!phone.trim()) {
      setError("Telefon nömrənizi yazın.");
      return;
    }
    if (Object.values(scores).some((v) => v < 1)) {
      setError("Zəhmət olmasa bütün suallara ulduz verin.");
      return;
    }
    startTransition(async () => {
      const res = await requestReviewOtpAction({ phone: phone.trim() });
      if (!res.ok) {
        setError(res.error ?? "Xəta baş verdi");
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
        setError(res.error ?? "Xəta baş verdi");
        return;
      }
      setDone(res.message ?? "Rəyiniz üçün təşəkkürlər!");
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <p className="mt-4 text-lg font-semibold text-emerald-800">{done}</p>
        <ButtonLink href={`/rentgen-merkezleri/${centerSlug}`} className="mt-6">
          Mərkəzin səhifəsinə keç
        </ButtonLink>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
          <ShieldCheck className="mb-1 h-5 w-5 text-brand-600" />
          <span className="font-semibold">{phone}</span> nömrəsinə təsdiq kodu
          göndərdik. Rəyin dərc olunması üçün kodu daxil edin.
        </div>
        {devCode && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Test rejimi — kod: <span className="font-bold">{devCode}</span>
          </p>
        )}
        <Field label="Təsdiq kodu" htmlFor="code" required>
          <Input
            id="code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6 rəqəmli kod"
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
            Rəyi göndər
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setError(null);
            }}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Geri
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="space-y-5">
      <p className="text-sm text-slate-500">
        Mərkəz: <span className="font-semibold text-ink-800">{centerName}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad" htmlFor="firstName" required>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Adınız" required />
        </Field>
        <Field label="Soyad" htmlFor="lastName" required>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Soyadınız" required />
        </Field>
      </div>
      <Field label="Telefon nömrəsi" htmlFor="phone" required hint="Təsdiq kodu bu nömrəyə gələcək.">
        <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050 123 45 67" required />
      </Field>

      <Field label="Sizi göndərən həkim" htmlFor="doctor" hint="İstəyə bağlı">
        <Select id="doctor" value={doctorSel} onChange={(e) => setDoctorSel(e.target.value)}>
          <option value="">Yoxdur / seçmək istəmirəm</option>
          {doctors.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
          <option value={MANUAL}>Digər (əl ilə yazım)</option>
        </Select>
      </Field>
      {doctorSel === MANUAL && (
        <Field label="Həkimin adı" htmlFor="doctorName">
          <Input id="doctorName" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Həkimin adı" />
        </Field>
      )}

      <RatingQuestions scores={scores} onChange={setScore} />

      <Field label="Rəyiniz (istəyə bağlı)" htmlFor="comment">
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Təcrübəniz haqqında yazın…"
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
        Davam et — təsdiq kodu al
      </Button>
    </form>
  );
}
