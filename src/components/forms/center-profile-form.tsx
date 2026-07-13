"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { Loader2, CheckCircle2, Building2, Phone, MapPin, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { LocationPicker } from "@/components/map/location-picker";
import { WeeklyHoursPicker } from "@/components/forms/weekly-hours-picker";
import type { WeeklyHours } from "@/lib/hours";
import { saveCenterProfileAction } from "@/app/merkez/actions";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

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
  licenseUrl?: string | null;
  bannerUrl?: string | null;
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
  licenseUrl: string;
  bannerUrl: string;
  images: string[];
  lat: number | null;
  lng: number | null;
};

export function CenterProfileForm({
  cities,
  defaults,
  mode,
  onSave,
  maxImages,
  allowBanner,
}: {
  cities: Option[];
  defaults?: CenterFormDefaults;
  mode: "create" | "edit";
  /** Overrides the default self-serve save (e.g. admin editing any center). */
  onSave?: (input: SaveInput) => Promise<{ ok: boolean; error?: string; message?: string }>;
  /** Max number of gallery photos allowed by the center's plan (default 12). */
  maxImages?: number;
  /** Whether the plan allows a profile banner (Platinum). */
  allowBanner?: boolean;
}) {
  const c = getPanelDict(useLocale()).cform;
  const imgCap = maxImages ?? 12;
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
  const [licenseUrl, setLicenseUrl] = React.useState(defaults?.licenseUrl ?? "");
  const [uploadingLicense, setUploadingLicense] = React.useState(false);
  const licenseRef = React.useRef<HTMLInputElement>(null);
  const [bannerUrl, setBannerUrl] = React.useState(defaults?.bannerUrl ?? "");
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const bannerRef = React.useRef<HTMLInputElement>(null);

  async function onPickBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingBanner(true);
    try {
      const blob = await upload(`center-banners/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setBannerUrl(blob.url);
    } catch {
      setError(c.errBanner);
    } finally {
      setUploadingBanner(false);
      if (bannerRef.current) bannerRef.current.value = "";
    }
  }

  async function onPickLicense(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingLicense(true);
    try {
      const blob = await upload(`center-licenses/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setLicenseUrl(blob.url);
    } catch {
      setError(c.errLicense);
    } finally {
      setUploadingLicense(false);
      if (licenseRef.current) licenseRef.current.value = "";
    }
  }
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
      for (const file of files.slice(0, imgCap - images.length)) {
        const blob = await upload(`center-images/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        uploaded.push(blob.url);
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, imgCap));
    } catch {
      setError(c.errImage);
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
      setError(c.errLogo);
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(null);
    // Radiology license is mandatory — registration/profile can't be saved without it.
    if (!licenseUrl) {
      setError(c.licenseRequired);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
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
        licenseUrl,
        bannerUrl: allowBanner ? bannerUrl : "",
        images,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      if (!res.ok) {
        setError(res.error ?? c.errGeneric);
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setDone(res.message ?? c.saved);
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

      <FormSection icon={<Building2 />} title={c.s1} stepLabel={c.step} step={1}>
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
            <p className="mb-1.5 text-sm font-medium text-ink-800">{c.logoLabel}</p>
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
                {c.logoUpload}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" /> {c.del}
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Kvadrat loqo tövsiyə olunur. PNG/SVG/WebP.
            </p>
          </div>
        </div>

        {/* Radiology license — mandatory */}
        <div
          className={
            "mb-5 rounded-2xl border p-4 " +
            (licenseUrl ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40")
          }
        >
          <p className="text-sm font-semibold text-ink-900">
            {c.licenseTitle} <span className="text-red-500">*</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {c.licenseHint}
          </p>
          <input
            ref={licenseRef}
            type="file"
            accept="image/png,image/webp,image/jpeg,application/pdf"
            onChange={onPickLicense}
            className="hidden"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => licenseRef.current?.click()}
              disabled={uploadingLicense}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {uploadingLicense ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {licenseUrl ? c.licenseChange : c.licenseUpload}
            </button>
            {licenseUrl && (
              <>
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <FileText className="h-3.5 w-3.5" /> {c.licenseView}
                </a>
                <button
                  type="button"
                  onClick={() => setLicenseUrl("")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" /> {c.del}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.nameLabel} htmlFor="name" required>
            <Input id="name" name="name" defaultValue={defaults?.name} required placeholder={c.namePh} />
          </Field>
          <Field label={c.responsible} htmlFor="responsiblePerson">
            <Input id="responsiblePerson" name="responsiblePerson" defaultValue={defaults?.responsiblePerson} placeholder={c.responsiblePh} />
          </Field>
        </div>
        <Field label={c.about} htmlFor="description">
          <Textarea id="description" name="description" defaultValue={defaults?.description} placeholder={c.aboutPh} />
        </Field>
      </FormSection>

      <FormSection icon={<Phone />} title={c.s2} stepLabel={c.step} step={2}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.phoneOfficial} htmlFor="phone" required>
            <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={defaults?.phone} required placeholder="050 123 45 67" />
          </Field>
          <Field label={c.whatsapp} htmlFor="whatsapp">
            <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" defaultValue={defaults?.whatsapp} placeholder="050 123 45 67" />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={<MapPin />} title={c.s3} stepLabel={c.step} step={3}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.cityDistrict} htmlFor="city" required>
            <Select id="city" name="city" defaultValue={defaults?.city ?? ""} required>
              <option value="" disabled>
                {c.select}
              </option>
              {cities.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={c.districtExtra} htmlFor="district">
            <Input id="district" name="district" defaultValue={defaults?.district} placeholder={c.districtPh} />
          </Field>
        </div>
        <Field label={c.address} htmlFor="address">
          <Input id="address" name="address" defaultValue={defaults?.address} placeholder={c.addressPh} />
        </Field>
        <Field label={c.mapsUrl} htmlFor="mapsUrl">
          <Input id="mapsUrl" name="mapsUrl" type="url" defaultValue={defaults?.mapsUrl} placeholder="https://maps.google.com/..." />
        </Field>
        <WeeklyHoursPicker value={hours} onChange={setHours} />
        <Field label={c.equipment} htmlFor="equipment">
          <Textarea id="equipment" name="equipment" defaultValue={defaults?.equipment} placeholder={c.equipmentPh} />
        </Field>

        {/* Gallery */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-800">
              {c.images}{" "}
              <span className="font-normal text-slate-400">({images.length}/{imgCap})</span>
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
              disabled={uploadingImg || images.length >= imgCap}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {uploadingImg ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {c.addImage}
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
                    aria-label={c.del}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              {c.imagesHint}
            </p>
          )}
        </div>

        {allowBanner && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-800">
              {c.banner}{" "}
              <span className="font-normal text-slate-400">{c.bannerHint}</span>
            </p>
            <input
              ref={bannerRef}
              type="file"
              accept="image/png,image/webp,image/jpeg"
              onChange={onPickBanner}
              className="hidden"
            />
            {bannerUrl ? (
              <div className="group relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerUrl} alt="Banner" className="h-32 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setBannerUrl("")}
                  className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label={c.del}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bannerRef.current?.click()}
                disabled={uploadingBanner}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                {uploadingBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {c.bannerUpload}
              </button>
            )}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">
            {c.mapLabel}{" "}
            <span className="font-normal text-slate-400">
              {c.mapHint}
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
          {mode === "create" ? c.createBtn : c.saveBtn}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  icon,
  title,
  step,
  stepLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  step: number;
  stepLabel: string;
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
            {stepLabel} {step}
          </p>
          <h3 className="font-display font-bold text-ink-900">{title}</h3>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
