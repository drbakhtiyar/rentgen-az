"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { Loader2, CheckCircle2, Building2, Phone, MapPin, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { LocationPicker } from "@/components/map/location-picker";
import { WeeklyHoursPicker } from "@/components/forms/weekly-hours-picker";
import type { WeeklyHours } from "@/lib/hours";
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
  hours?: WeeklyHours | null;
  equipment?: string;
  responsiblePerson?: string;
  description?: string;
  logoUrl?: string | null;
  images?: string[];
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
  hours: WeeklyHours | null;
  equipment: string;
  responsiblePerson: string;
  description: string;
  logoUrl: string;
  images: string[];
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
  const [logoUrl, setLogoUrl] = React.useState(defaults?.logoUrl ?? "");
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const logoRef = React.useRef<HTMLInputElement>(null);
  const [hours, setHours] = React.useState<WeeklyHours | null>(defaults?.hours ?? null);
  const [images, setImages] = React.useState<string[]>(defaults?.images ?? []);
  const [uploadingImg, setUploadingImg] = React.useState(false);
  const imgRef = React.useRef<HTMLInputElement>(null);

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setUploadingImg(true);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, 12 - images.length)) {
        const blob = await upload(`center-images/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        uploaded.push(blob.url);
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 12));
    } catch {
      setError("Şəkil yüklənmədi. Yenidən cəhd edin.");
    } finally {
      setUploadingImg(false);
      if (imgRef.current) imgRef.current.value = "";
    }
  }

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingLogo(true);
    try {
      const blob = await upload(`center-logos/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setLogoUrl(blob.url);
    } catch {
      setError("Loqo yüklənmədi. Yenidən cəhd edin.");
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  }

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
        hours,
        equipment: get("equipment"),
        responsiblePerson: get("responsiblePerson"),
        description: get("description"),
        logoUrl,
        images,
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
        {/* Logo */}
        <div className="mb-5 flex items-center gap-4">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Loqo" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-slate-300" />
            )}
          </span>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-800">Mərkəzin loqosu</p>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/webp,image/svg+xml,image/jpeg"
              onChange={onPickLogo}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={uploadingLogo}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Loqo yüklə
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" /> Sil
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Kvadrat loqo tövsiyə olunur. PNG/SVG/WebP.
            </p>
          </div>
        </div>

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
        <Field label="Google Maps linki" htmlFor="mapsUrl">
          <Input id="mapsUrl" name="mapsUrl" type="url" defaultValue={defaults?.mapsUrl} placeholder="https://maps.google.com/..." />
        </Field>
        <WeeklyHoursPicker value={hours} onChange={setHours} />
        <Field label="Avadanlıq məlumatı" htmlFor="equipment">
          <Textarea id="equipment" name="equipment" defaultValue={defaults?.equipment} placeholder="Məs: CBCT aparatı, panoramik aparat və s." />
        </Field>

        {/* Gallery */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-800">
              Şəkillər{" "}
              <span className="font-normal text-slate-400">({images.length}/12)</span>
            </p>
            <input
              ref={imgRef}
              type="file"
              accept="image/png,image/webp,image/jpeg"
              multiple
              onChange={onPickImages}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imgRef.current?.click()}
              disabled={uploadingImg || images.length >= 12}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {uploadingImg ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Şəkil əlavə et
            </button>
          </div>
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img, i) => (
                <div key={img} className="group relative aspect-video overflow-hidden rounded-lg ring-1 ring-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Şəkil ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((x) => x !== img))}
                    className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Sil"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Mərkəzin fotolarını əlavə edin — kartda və mərkəz səhifəsində görünəcək.
            </p>
          )}
        </div>
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
