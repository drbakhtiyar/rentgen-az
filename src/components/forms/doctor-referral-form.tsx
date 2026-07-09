"use client";

import * as React from "react";
import { Loader2, Send, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { DatePicker } from "@/components/forms/date-picker";
import { bakuTodayYmd, slotsForDate, type WeeklyHours } from "@/lib/hours";
import {
  requestReferralOtpAction,
  submitDoctorReferralAction,
} from "@/app/hekimler-ucun/actions";

type CenterOpt = { id: string; name: string; city: string | null };
type ServiceOpt = { slug: string; name: string };

export function DoctorReferralForm({
  doctorName,
  clinic,
  centers,
  servicesByCenter,
  hoursByCenter,
  lockedCenterId,
}: {
  doctorName: string;
  clinic: string | null;
  centers: CenterOpt[];
  servicesByCenter: Record<string, ServiceOpt[]>;
  hoursByCenter: Record<string, WeeklyHours | null>;
  /** When set, the center is fixed (e.g. on a center's own page). */
  lockedCenterId?: string;
}) {
  const [step, setStep] = React.useState<"form" | "otp">("form");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const [centerId, setCenterId] = React.useState(lockedCenterId ?? "");
  const [serviceSlug, setServiceSlug] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [note, setNote] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [code, setCode] = React.useState("");

  const services = centerId ? servicesByCenter[centerId] ?? [] : [];
  const centerHours = centerId ? hoursByCenter[centerId] ?? null : null;
  const today = React.useMemo(() => bakuTodayYmd(), []);
  const slots = React.useMemo(
    () => (centerHours && date ? slotsForDate(centerHours, date) : []),
    [centerHours, date],
  );

  function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!centerId) return setError("Mərkəzi seçin.");
    if (firstName.trim().length < 2 || lastName.trim().length < 2)
      return setError("Pasiyentin ad və soyadını yazın.");
    if (!phone.trim()) return setError("Pasiyentin nömrəsini yazın.");
    startTransition(async () => {
      const res = await requestReferralOtpAction({ phone: phone.trim() });
      if (!res.ok) return setError(res.error ?? "Xəta");
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
      });
      if (!res.ok) return setError(res.error ?? "Xəta");
      setDone(res.message ?? "Göndəriş tamamlandı.");
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
          <span className="font-semibold">{phone}</span> nömrəsinə təsdiq kodu
          göndərdik. Göndərişin tamamlanması üçün pasiyentdən kodu alıb daxil edin.
        </div>
        {devCode && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Test rejimi — kod: <span className="font-bold">{devCode}</span>
          </p>
        )}
        <Field label="Təsdiq kodu" htmlFor="ref-code" required>
          <Input
            id="ref-code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6 rəqəmli kod"
            autoFocus
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={pending || code.trim().length < 4}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Göndərişi tamamla
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
    <form onSubmit={requestOtp} className="space-y-4">
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Həkim: <span className="font-semibold text-ink-800">{doctorName}</span>
        {clinic ? ` · ${clinic}` : ""}
      </p>

      <Field label="Mərkəz" htmlFor="ref-center" required hint={lockedCenterId ? undefined : "Yalnız partnyor mərkəzləriniz"}>
        {lockedCenterId ? (
          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-ink-800">
            {centers.find((c) => c.id === lockedCenterId)?.name ?? "Mərkəz"}
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
            <option value="">Mərkəz seçin</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.city ? ` — ${c.city}` : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Lazım olan müayinə" htmlFor="ref-service">
        <Select
          id="ref-service"
          value={serviceSlug}
          onChange={(e) => setServiceSlug(e.target.value)}
          disabled={!centerId}
        >
          <option value="">
            {!centerId
              ? "İlk öncə mərkəzi seçin"
              : services.length === 0
                ? "Bu mərkəzdə xidmət yoxdur"
                : "Müayinə seçin (istəyə bağlı)"}
          </option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pasiyentin adı" htmlFor="ref-first" required>
          <Input id="ref-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ad" required />
        </Field>
        <Field label="Pasiyentin soyadı" htmlFor="ref-last" required>
          <Input id="ref-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Soyad" required />
        </Field>
      </div>

      <Field label="Pasiyentin telefonu" htmlFor="ref-phone" required hint="Təsdiq kodu bu nömrəyə gedəcək.">
        <Input id="ref-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050 123 45 67" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tarix" htmlFor="ref-date" hint="İstəyə bağlı">
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
              İlk öncə mərkəzi seçin
            </button>
          )}
        </Field>
        <Field label="Saat" htmlFor="ref-time">
          <Select
            id="ref-time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!centerHours || !date || slots.length === 0}
          >
            <option value="">
              {!centerId
                ? "İlk öncə mərkəzi seçin"
                : !date
                  ? "Əvvəlcə tarix seçin"
                  : slots.length === 0
                    ? "Vaxt yoxdur"
                    : "Saat seçin"}
            </option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Qeyd" htmlFor="ref-note">
        <Textarea id="ref-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Əlavə məlumat (istəyə bağlı)" />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Davam et — pasiyentə təsdiq kodu göndər
      </Button>
    </form>
  );
}
