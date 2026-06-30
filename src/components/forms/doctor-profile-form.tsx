"use client";

import * as React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/field";
import { saveDoctorProfileAction } from "@/app/hekim/actions";

type Option = { value: string; label: string };

export function DoctorProfileForm({
  cities,
  phone,
  defaults,
  mode,
}: {
  cities: Option[];
  phone: string;
  defaults?: {
    firstName?: string;
    lastName?: string;
    clinic?: string;
    specialization?: string;
    city?: string;
  };
  mode: "create" | "edit";
}) {
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    startTransition(async () => {
      const res = await saveDoctorProfileAction({
        firstName: get("firstName"),
        lastName: get("lastName"),
        clinic: get("clinic"),
        specialization: get("specialization"),
        city: get("city"),
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setMessage(res.message ?? "Yadda saxlanıldı.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad" htmlFor="firstName" required>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaults?.firstName}
            required
            placeholder="Adınız"
          />
        </Field>
        <Field label="Soyad" htmlFor="lastName" required>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaults?.lastName}
            required
            placeholder="Soyadınız"
          />
        </Field>
      </div>

      <Field label="Klinika" htmlFor="clinic">
        <Input
          id="clinic"
          name="clinic"
          defaultValue={defaults?.clinic}
          placeholder="Klinikanın adı"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="İxtisas" htmlFor="specialization">
          <Input
            id="specialization"
            name="specialization"
            defaultValue={defaults?.specialization}
            placeholder="Məs: Ortodont, İmplantoloq"
          />
        </Field>
        <Field label="Şəhər" htmlFor="city">
          <Select id="city" name="city" defaultValue={defaults?.city ?? ""}>
            <option value="">Seçin</option>
            {cities.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Telefon nömrəsi"
        htmlFor="phone"
        hint="Telefon nömrəsi dəyişdirilə bilməz (hesab identifikatoru)."
      >
        <Input id="phone" value={phone} disabled />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      {message && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? "Profili yarat" : "Yadda saxla"}
        </Button>
      </div>
    </form>
  );
}
