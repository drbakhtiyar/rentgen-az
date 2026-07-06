"use client";

import * as React from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { submitAppointmentAction } from "@/app/actions/public";
import { bakuTodayYmd, slotsForDate, type WeeklyHours } from "@/lib/hours";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

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
  const today = React.useMemo(() => bakuTodayYmd(), []);
  const slots = React.useMemo(
    () => (hours && date ? slotsForDate(hours, date) : []),
    [hours, date],
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const preferredDate =
      date && time ? `${date}T${time}:00+04:00` : undefined;
    startTransition(async () => {
      const res = await submitAppointmentAction({
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        centerId,
        doctorId: String(fd.get("doctorId") ?? ""),
        serviceSlug: String(fd.get("serviceSlug") ?? ""),
        note: String(fd.get("note") ?? ""),
        preferredDate,
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta baş verdi");
        return;
      }
      setDone(res.message ?? "Müraciətiniz göndərildi.");
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
        <Select id="serviceSlug" name="serviceSlug" defaultValue={defaultService ?? ""}>
          <option value="">{t.serviceOpt}</option>
          {services.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      {doctors && doctors.length > 0 && (
        <Field label={t.doctor} htmlFor="doctorId" hint={t.doctorHint}>
          <Select id="doctorId" name="doctorId" defaultValue="">
            <option value="">{t.doctorOpt}</option>
            {doctors.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {hours && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.date} htmlFor="date" hint={t.dateHint}>
            <Input
              id="date"
              name="date"
              type="date"
              min={today}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
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
              disabled={!date || slots.length === 0}
            >
              <option value="">
                {!date ? t.pickDate : slots.length === 0 ? t.noSlots : t.pickTime}
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
        {t.submit}
      </Button>
      <p className="text-center text-xs text-slate-400">{t.disclaimer}</p>
    </form>
  );
}
