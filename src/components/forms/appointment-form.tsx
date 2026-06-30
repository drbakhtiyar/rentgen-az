"use client";

import * as React from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { submitAppointmentAction } from "@/app/actions/public";

type Option = { value: string; label: string };

export function AppointmentForm({
  centerId,
  centerName,
  services,
  doctors,
  defaultService,
  compact,
}: {
  centerId?: string;
  centerName?: string;
  services: Option[];
  doctors?: Option[];
  defaultService?: string;
  compact?: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitAppointmentAction({
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        centerId,
        doctorId: String(fd.get("doctorId") ?? ""),
        serviceSlug: String(fd.get("serviceSlug") ?? ""),
        note: String(fd.get("note") ?? ""),
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
          Mərkəz: <span className="font-semibold text-ink-800">{centerName}</span>
        </p>
      )}
      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <Field label="Ad, Soyad" htmlFor="name" required>
          <Input id="name" name="name" placeholder="Adınız" required />
        </Field>
        <Field label="Telefon nömrəsi" htmlFor="phone" required>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="050 123 45 67"
            required
          />
        </Field>
      </div>
      <Field label="Müayinə növü" htmlFor="serviceSlug">
        <Select id="serviceSlug" name="serviceSlug" defaultValue={defaultService ?? ""}>
          <option value="">Seçin (istəyə bağlı)</option>
          {services.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      {doctors && doctors.length > 0 && (
        <Field
          label="Sizi yönləndirən həkim"
          htmlFor="doctorId"
          hint="Həkiminiz varsa seçin — o, müraciətinizi izləyə biləcək."
        >
          <Select id="doctorId" name="doctorId" defaultValue="">
            <option value="">Həkim seçin (istəyə bağlı)</option>
            {doctors.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Qeyd" htmlFor="note">
        <Textarea id="note" name="note" placeholder="Əlavə məlumat (istəyə bağlı)" />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Müraciət göndər
      </Button>
      <p className="text-center text-xs text-slate-400">
        Müraciətiniz seçilmiş mərkəzə çatdırılır. Ödəniş platformada alınmır.
      </p>
    </form>
  );
}
