"use client";

import * as React from "react";
import { Loader2, Send, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { DatePicker } from "@/components/forms/date-picker";
import { bakuTodayYmd, slotsForDate, type WeeklyHours } from "@/lib/hours";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import {
  requestReferralOtpAction,
  submitDoctorReferralAction,
} from "@/app/hekimler-ucun/actions";
import { getCenterFreeSlotsAction } from "@/app/actions/public";

type CenterOpt = { id: string; name: string; city: string | null };
type ServiceOpt = { slug: string; name: string };

export function DoctorReferralForm({
  doctorName,
  clinic,
  centers,
  servicesByCenter,
  hoursByCenter,
  lockedCenterId,
  locale = DEFAULT_LOCALE,
  invited = false,
  needsName = false,
}: {
  doctorName: string;
  clinic: string | null;
  centers: CenterOpt[];
  servicesByCenter: Record<string, ServiceOpt[]>;
  hoursByCenter: Record<string, WeeklyHours | null>;
  /** When set, the center is fixed (e.g. on a center's own page). */
  lockedCenterId?: string;
  locale?: Locale;
  /** QR-invited referral (relaxed gating on the server). */
  invited?: boolean;
  /** First-time QR doctor: collect the doctor's own name once. */
  needsName?: boolean;
}) {
  const t = getDict(locale).referral;
  const [step, setStep] = React.useState<"form" | "otp">("form");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const [centerId, setCenterId] = React.useState(lockedCenterId ?? "");
  const [serviceSlug, setServiceSlug] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  // The doctor's own name (only when a first-time QR doctor has no profile yet).
  const [docFirst, setDocFirst] = React.useState("");
  const [docLast, setDocLast] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [note, setNote] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [code, setCode] = React.useState("");

  const services = centerId ? servicesByCenter[centerId] ?? [] : [];
  const centerHours = centerId ? hoursByCenter[centerId] ?? null : null;
  const today = React.useMemo(() => bakuTodayYmd(), []);
  const localSlots = React.useMemo(
    () => (centerHours && date ? slotsForDate(centerHours, date) : []),
    [centerHours, date],
  );
  // Occupancy-aware slots: a time that already has a patient is not offered
  // again, so a doctor can't book the next patient into the same slot.
  const [remoteSlots, setRemoteSlots] = React.useState<string[]>([]);
  const [remoteReady, setRemoteReady] = React.useState(false);
  React.useEffect(() => {
    if (!centerId || !date) {
      setRemoteSlots([]);
      setRemoteReady(false);
      return;
    }
    let cancelled = false;
    getCenterFreeSlotsAction({ centerId, ymd: date, serviceSlug: serviceSlug || undefined })
      .then((r) => {
        if (cancelled) return;
        setRemoteSlots(r.slots);
        setRemoteReady(r.ok);
      })
      .catch(() => !cancelled && setRemoteReady(false));
    return () => {
      cancelled = true;
    };
  }, [centerId, date, serviceSlug]);
  const slots = remoteReady ? remoteSlots : localSlots;

  function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!centerId) return setError(t.errCenter);
    if (needsName && (docFirst.trim().length < 2 || docLast.trim().length < 2))
      return setError(t.errName);
    if (firstName.trim().length < 2 || lastName.trim().length < 2)
      return setError(t.errName);
    if (!phone.trim()) return setError(t.errPhone);
    startTransition(async () => {
      const res = await requestReferralOtpAction({ phone: phone.trim() });
      if (!res.ok) return setError(res.error ?? t.errGeneric);
      setDevCode(res.devCode ?? null);
      setStep("otp");
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitDoctorReferralAction({
        centerId,
        serviceSlug,
        patientFirstName: firstName.trim(),
        patientLastName: lastName.trim(),
        phone: phone.trim(),
        code: code.trim(),
        note: note.trim() || undefined,
        preferredDate: date && time ? `${date}T${time}:00+04:00` : undefined,
        invited,
        doctorFirstName: needsName ? docFirst.trim() : undefined,
        doctorLastName: needsName ? docLast.trim() : undefined,
      });
      if (!res.ok) return setError(res.error ?? t.errGeneric);
      setDone(res.message ?? t.submitted);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-semibold text-emerald-800">{done}</p>
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
        <Field label={t.otpLabel} htmlFor="ref-code" required>
          <Input
            id="ref-code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.otpPlaceholder}
            autoFocus
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={pending || code.trim().length < 4}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t.complete}
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
    <form onSubmit={requestOtp} className="space-y-4">
      {needsName ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.docFirstLabel} htmlFor="ref-docfirst" required>
            <Input id="ref-docfirst" value={docFirst} onChange={(e) => setDocFirst(e.target.value)} placeholder={t.firstPh} required />
          </Field>
          <Field label={t.docLastLabel} htmlFor="ref-doclast" required>
            <Input id="ref-doclast" value={docLast} onChange={(e) => setDocLast(e.target.value)} placeholder={t.lastPh} required />
          </Field>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t.doctorLabel}: <span className="font-semibold text-ink-800">{doctorName}</span>
          {clinic ? ` · ${clinic}` : ""}
        </p>
      )}

      <Field label={t.centerLabel} htmlFor="ref-center" required hint={lockedCenterId ? undefined : t.centerHintPartner}>
        {lockedCenterId ? (
          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-ink-800">
            {centers.find((c) => c.id === lockedCenterId)?.name ?? t.centerFallback}
          </div>
        ) : (
          <Select
            id="ref-center"
            value={centerId}
            onChange={(e) => {
              setCenterId(e.target.value);
              setServiceSlug("");
              setDate("");
              setTime("");
            }}
            required
          >
            <option value="">{t.centerPlaceholder}</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.city ? ` — ${c.city}` : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label={t.serviceLabel} htmlFor="ref-service">
        <Select
          id="ref-service"
          value={serviceSlug}
          onChange={(e) => {
            setServiceSlug(e.target.value);
            setTime(""); // offered slots depend on the service's duration
          }}
          disabled={!centerId}
        >
          <option value="">
            {!centerId
              ? t.servicePickCenter
              : services.length === 0
                ? t.serviceNone
                : t.servicePick}
          </option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.firstLabel} htmlFor="ref-first" required>
          <Input id="ref-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t.firstPh} required />
        </Field>
        <Field label={t.lastLabel} htmlFor="ref-last" required>
          <Input id="ref-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t.lastPh} required />
        </Field>
      </div>

      <Field label={t.phoneLabel} htmlFor="ref-phone" required hint={t.phoneHint}>
        <Input id="ref-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePlaceholder} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.dateLabel} htmlFor="ref-date" hint={t.optional}>
          {centerHours ? (
            <DatePicker
              value={date}
              minYmd={today}
              hours={centerHours}
              onChange={(v) => {
                setDate(v);
                setTime("");
              }}
            />
          ) : (
            <button
              type="button"
              disabled
              className="flex h-11 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-400"
            >
              {t.pickCenterFirst}
            </button>
          )}
        </Field>
        <Field label={t.timeLabel} htmlFor="ref-time">
          <Select
            id="ref-time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!centerHours || !date || slots.length === 0}
          >
            <option value="">
              {!centerId
                ? t.pickCenterFirst
                : !date
                  ? t.pickDateFirst
                  : slots.length === 0
                    ? t.noTime
                    : t.pickTime}
            </option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t.noteLabel} htmlFor="ref-note">
        <Textarea id="ref-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.notePh} />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t.submit}
      </Button>
    </form>
  );
}
