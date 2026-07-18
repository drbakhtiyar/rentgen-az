"use client";

import * as React from "react";
import { track } from "@vercel/analytics";
import { Loader2, CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import {
  submitAppointmentAction,
  requestAppointmentOtpAction,
  getCenterFreeSlotsAction,
} from "@/app/actions/public";
import { bakuTodayYmd, slotsForDate, type WeeklyHours } from "@/lib/hours";
import { DatePicker } from "@/components/forms/date-picker";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { SuggestInput } from "@/components/forms/suggest-input";

type Option = { value: string; label: string };

export function AppointmentForm({
  centerId,
  centerName,
  services,
  doctors,
  defaultService,
  hours,
  patient,
  locale = DEFAULT_LOCALE,
  compact,
}: {
  centerId?: string;
  centerName?: string;
  services: Option[];
  doctors?: Option[];
  defaultService?: string;
  /** center's structured hours — enables date + time slot picking */
  hours?: WeeklyHours | null;
  /** logged-in patient → name/phone are prefilled, phone is locked */
  patient?: { name: string; phone: string } | null;
  locale?: Locale;
  compact?: boolean;
}) {
  const t = getDict(locale).appt;
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [service, setService] = React.useState(defaultService ?? "");
  const [step, setStep] = React.useState<"form" | "otp">("form");
  const [code, setCode] = React.useState("");
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [otpPhone, setOtpPhone] = React.useState("");
  // Snapshot of the form values captured when moving to the OTP step.
  const pendingRef = React.useRef<Record<string, string>>({});
  const today = React.useMemo(() => bakuTodayYmd(), []);
  // Plain hours slots (fallback when we can't reach the server).
  const localSlots = React.useMemo(
    () => (hours && date ? slotsForDate(hours, date) : []),
    [hours, date],
  );
  // Occupancy-aware slots from the server: already-booked times are never
  // offered again (no double booking), for ANY center with structured hours.
  // Re-fetches when the date or the chosen service (its duration) changes.
  const [remoteSlots, setRemoteSlots] = React.useState<string[]>([]);
  const [remoteReady, setRemoteReady] = React.useState(false);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  React.useEffect(() => {
    if (!centerId || !date) {
      setRemoteSlots([]);
      setRemoteReady(false);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    getCenterFreeSlotsAction({ centerId, ymd: date, serviceSlug: service || undefined })
      .then((r) => {
        if (cancelled) return;
        setRemoteSlots(r.slots);
        setRemoteReady(r.ok); // ok=false (no structured hours) → use local slots
      })
      .catch(() => !cancelled && setRemoteReady(false))
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [centerId, date, service]);
  const slots = remoteReady ? remoteSlots : localSlots;
  // Logged-in patients skip OTP (phone already verified at login).
  const skipOtp = !!patient;

  // North Star conversion (REN-25 §6 / REN-33): emitted on every successful
  // appointment submit — both the logged-in fast path and the OTP path — so
  // social-sourced conversions are measurable alongside UTM segmentation.
  function trackConversion() {
    track("appointment_request", {
      centerId: centerId ?? "unknown",
      serviceSlug: pendingRef.current.serviceSlug || "unspecified",
    });
  }

  function payload(extra?: { code?: string }) {
    const p = pendingRef.current;
    const preferredDate = date && time ? `${date}T${time}:00+04:00` : undefined;
    return {
      name: p.name,
      phone: p.phone,
      centerId,
      doctorId: p.doctorId || "",
      serviceSlug: p.serviceSlug || "",
      note: p.note || "",
      preferredDate,
      code: extra?.code,
    };
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    pendingRef.current = {
      name: String(fd.get("name") ?? ""),
      phone: patient?.phone ?? String(fd.get("phone") ?? ""),
      doctorId: String(fd.get("doctorId") ?? ""),
      serviceSlug: String(fd.get("serviceSlug") ?? ""),
      note: String(fd.get("note") ?? ""),
    };
    startTransition(async () => {
      if (skipOtp) {
        const res = await submitAppointmentAction(payload());
        if (!res.ok) return setError(res.error ?? t.errGeneric);
        trackConversion();
        setDone(res.message ?? t.submitted);
        return;
      }
      // Not logged in → verify the phone with an OTP first.
      const res = await requestAppointmentOtpAction({ phone: pendingRef.current.phone });
      if (!res.ok) return setError(res.error ?? t.errGeneric);
      setDevCode(res.devCode ?? null);
      setOtpPhone(pendingRef.current.phone);
      setStep("otp");
    });
  }

  function verifyAndSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitAppointmentAction(payload({ code: code.trim() }));
      if (!res.ok) return setError(res.error ?? t.errGeneric);
      trackConversion();
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
      <form onSubmit={verifyAndSubmit} className="space-y-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
          <ShieldCheck className="mb-1 h-5 w-5 text-brand-600" />
          {t.otpSentPre}
          <span className="font-semibold">{otpPhone}</span>
          {t.otpSentPost}
        </div>
        {devCode && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t.otpTestMode}<span className="font-bold">{devCode}</span>
          </p>
        )}
        <Field label={t.otpLabel} htmlFor="apt-code" required>
          <Input
            id="apt-code"
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
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t.verifySubmit}
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
    <form onSubmit={onSubmit} className="space-y-4">
      {centerName && (
        <p className="text-sm text-slate-500">
          {t.centerLabel}: <span className="font-semibold text-ink-800">{centerName}</span>
        </p>
      )}
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field label={t.name} htmlFor="name" required>
          <Input
            id="name"
            name="name"
            placeholder={t.namePh}
            defaultValue={patient?.name ?? ""}
            required
          />
        </Field>
        <Field
          label={t.phone}
          htmlFor="phone"
          required
          hint={patient ? t.phoneLocked : undefined}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="050 123 45 67"
            defaultValue={patient?.phone ?? ""}
            readOnly={!!patient}
            className={patient ? "bg-slate-50 text-slate-500" : undefined}
            required
          />
        </Field>
      </div>
      <Field label={t.service} htmlFor="serviceSlug">
        {patient ? (
          <Select
            id="serviceSlug"
            name="serviceSlug"
            value={service}
            onChange={(e) => {
              setService(e.target.value);
              setTime(""); // offered slots depend on the service's duration
            }}
          >
            <option value="">{t.serviceOpt}</option>
            {services.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        ) : (
          // Guests type instead of scrolling a list — suggestions after 3 letters.
          <SuggestInput
            id="serviceSlug"
            name="serviceSlug"
            options={services}
            placeholder={t.serviceOpt}
            typeHint={t.typeToSearch}
            noMatches={t.noMatches}
            onPick={(v) => {
              setService(v);
              setTime("");
            }}
          />
        )}
      </Field>
      {doctors && doctors.length > 0 && (
        <Field label={t.doctor} htmlFor="doctorId" hint={t.doctorHint}>
          {patient ? (
            <Select id="doctorId" name="doctorId" defaultValue="">
              <option value="">{t.doctorOpt}</option>
              {doctors.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          ) : (
            <SuggestInput
              id="doctorId"
              name="doctorId"
              options={doctors}
              placeholder={t.doctorOpt}
              typeHint={t.typeToSearch}
              noMatches={t.noMatches}
            />
          )}
        </Field>
      )}
      {hours && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.date} htmlFor="date" hint={t.dateHint}>
            <DatePicker
              value={date}
              minYmd={today}
              hours={hours}
              placeholder={t.pickDate}
              onChange={(v) => {
                setDate(v);
                setTime("");
              }}
            />
          </Field>
          <Field label={t.time} htmlFor="time">
            <Select
              id="time"
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!date || slotsLoading || slots.length === 0}
            >
              <option value="">
                {!date
                  ? t.pickDate
                  : slotsLoading
                    ? t.pickTime
                    : slots.length === 0
                      ? t.noSlots
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
      )}

      <Field label={t.note} htmlFor="note">
        <Textarea id="note" name="note" placeholder={t.notePh} />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {skipOtp ? t.submit : t.submitOtp}
      </Button>
      <p className="text-center text-xs text-slate-400">{t.disclaimer}</p>
    </form>
  );
}
