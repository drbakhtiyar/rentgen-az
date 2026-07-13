"use client";

import * as React from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/field";
import { BirthDatePicker } from "@/components/forms/birth-date-picker";
import { savePatientProfileAction } from "@/app/kabinet/actions";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

type Option = { value: string; label: string };

export function PatientProfileForm({
  cities,
  phone,
  defaults,
}: {
  cities: Option[];
  phone: string;
  defaults?: {
    firstName?: string;
    lastName?: string;
    city?: string;
    district?: string;
    birthDate?: string;
  };
}) {
  const f = getPanelDict(useLocale()).form;
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    startTransition(async () => {
      const res = await savePatientProfileAction({
        firstName: get("firstName"),
        lastName: get("lastName"),
        city: get("city"),
        district: get("district"),
        birthDate: get("birthDate"),
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setDone(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.firstName} htmlFor="firstName" required>
          <Input id="firstName" name="firstName" defaultValue={defaults?.firstName} required placeholder={f.firstNamePh} />
        </Field>
        <Field label={f.lastName} htmlFor="lastName" required>
          <Input id="lastName" name="lastName" defaultValue={defaults?.lastName} required placeholder={f.lastNamePh} />
        </Field>
      </div>
      <Field label={f.phoneLabel} htmlFor="phone" hint={f.phoneHint}>
        <Input id="phone" value={phone} disabled />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.cityDistrict} htmlFor="city">
          <Select id="city" name="city" defaultValue={defaults?.city ?? ""}>
            <option value="">{f.select}</option>
            {cities.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={f.birthDate} htmlFor="birthDate">
          <BirthDatePicker name="birthDate" defaultValue={defaults?.birthDate} />
        </Field>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {f.save}
        </Button>
        {done && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {f.saved}
          </span>
        )}
      </div>
    </form>
  );
}
