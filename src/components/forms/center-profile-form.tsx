"use client";

import * as React from "react";
import { Loader2, CheckCircle2, Building2, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { LocationPicker } from "@/components/map/location-picker";
import { saveCenterProfileAction } from "@/app/merkez/actions";

type Option = { value: string; label: string };

export type CenterFormDefaults = {
  name?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  district?: string;
  mapsUrl?: string;
  workingHours?: string;
  equipment?: string;
  responsiblePerson?: string;
  description?: string;
  lat?: number | null;
  lng?: number | null;
};

type SaveInput = {
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  district: string;
  mapsUrl: string;
  workingHours: string;
  equipment: string;
  responsiblePerson: string;
  description: string;
  lat: number | null;
  lng: number | null;
};

export function CenterProfileForm({
  cities,
  defaults,
  mode,
  onSave,
}: {
  cities: Option[];
  defaults?: CenterFormDefaults;
  mode: "create" | "edit";
  /** Overrides the default self-serve save (e.g. admin editing any center). */
  onSave?: (input: SaveInput) => Promise<{ ok: boolean; error?: string; message?: string }>;
}) {
  const [pending, startTransition] = React.useTransition();
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(
    typeof defaults?.lat === "number" && typeof defaults?.lng === "number"
      ? { lat: defaults.lat, lng: defaults.lng }
      : null,
  );
  const [done, setDone] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    startTransition(async () => {
      const save = onSave ?? saveCenterProfileAction;
      const res = await save({
        name: get("name"),
        phone: get("phone"),
        whatsapp: get("whatsapp"),
        address: get("address"),
        city: get("city"),
        district: get("district"),
        mapsUrl: get("mapsUrl"),
        workingHours: get("workingHours"),
        equipment: get("equipment"),
        responsiblePerson: get("responsiblePerson"),
        description: get("description"),
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta baş verdi");
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setDone(res.message ?? "Yadda saxlanıldı.");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {done && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> {done}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <FormSection icon={<Building2 />} title="Əsas məlumat" step={1}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mərkəzin adı" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={defaults?.name} required placeholder="Məs: Dental Imaging Center" />
          </Field>
          <Field label="Məsul şəxs" htmlFor="responsiblePerson">
            <Input id="responsiblePerson" name="responsiblePerson" defaultValue={defaults?.responsiblePerson} placeholder="Ad Soyad" />
          </Field>
        </div>
        <Field label="Mərkəz haqqında" htmlFor="description">
          <Textarea id="description" name="description" defaultValue={defaults?.description} placeholder="Mərkəz, avadanlıq və xidmətlər haqqında qısa məlumat" />
        </Field>
      </FormSection>

      <FormSection icon={<Phone />} title="Əlaqə" step={2}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rəsmi telefon" htmlFor="phone" required>
            <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={defaults?.phone} required placeholder="050 123 45 67" />
          </Field>
          <Field label="WhatsApp nömrəsi" htmlFor="whatsapp">
            <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" defaultValue={defaults?.whatsapp} placeholder="050 123 45 67" />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={<MapPin />} title="Ünvan və iş saatları" step={3}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Şəhər / rayon" htmlFor="city" required>
            <Select id="city" name="city" defaultValue={defaults?.city ?? ""} required>
              <option value="" disabled>
                Seçin
              </option>
              {cities.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rayon / qəsəbə (əlavə)" htmlFor="district">
            <Input id="district" name="district" defaultValue={defaults?.district} placeholder="Məs: 28 May" />
          </Field>
        </div>
        <Field label="Ünvan" htmlFor="address">
          <Input id="address" name="address" defaultValue={defaults?.address} placeholder="Küçə, bina" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Google Maps linki" htmlFor="mapsUrl">
            <Input id="mapsUrl" name="mapsUrl" type="url" defaultValue={defaults?.mapsUrl} placeholder="https://maps.google.com/..." />
          </Field>
          <Field label="İş saatları" htmlFor="workingHours">
            <Input id="workingHours" name="workingHours" defaultValue={defaults?.workingHours} placeholder="B.e–Şənbə 09:00–18:00" />
          </Field>
        </div>
        <Field label="Avadanlıq məlumatı" htmlFor="equipment">
          <Textarea id="equipment" name="equipment" defaultValue={defaults?.equipment} placeholder="Məs: CBCT aparatı, panoramik aparat və s." />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">
            Xəritədə yeriniz{" "}
            <span className="font-normal text-slate-400">
              — pasiyentlər «yaxınımdakı mərkəz» ilə sizi tapsın (istəyə bağlı)
            </span>
          </p>
          <LocationPicker
            lat={defaults?.lat}
            lng={defaults?.lng}
            getAddress={() =>
              (document.getElementById("address") as HTMLInputElement | null)?.value ?? ""
            }
            onChange={(lat, lng) => setCoords({ lat, lng })}
          />
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? "Profili yarat" : "Dəyişiklikləri yadda saxla"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  icon,
  title,
  step,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Addım {step}
          </p>
          <h3 className="font-display font-bold text-ink-900">{title}</h3>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
