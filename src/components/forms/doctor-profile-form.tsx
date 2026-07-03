"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import {
  Loader2,
  CheckCircle2,
  Upload,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/field";
import { DENTAL_SPECIALIZATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { saveDoctorProfileAction } from "@/app/hekim/actions";

type Option = { value: string; label: string };

export type DoctorFormDefaults = {
  firstName?: string;
  lastName?: string;
  clinic?: string;
  specializations?: string[];
  city?: string;
  instagram?: string;
  website?: string;
  diplomaUrl?: string;
  certificateUrl?: string;
};

type SaveInput = {
  firstName: string;
  lastName: string;
  clinic: string;
  specializations: string[];
  city: string;
  instagram: string;
  website: string;
  diplomaUrl: string;
  certificateUrl: string;
};

export function DoctorProfileForm({
  cities,
  phone,
  defaults,
  mode,
  onSave,
}: {
  cities: Option[];
  phone: string;
  defaults?: DoctorFormDefaults;
  mode: "create" | "edit";
  /** Overrides the default self-serve save (e.g. admin editing any doctor). */
  onSave?: (input: SaveInput) => Promise<{ ok: boolean; error?: string; message?: string }>;
}) {
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [specs, setSpecs] = React.useState<string[]>(defaults?.specializations ?? []);
  const [diplomaUrl, setDiplomaUrl] = React.useState(defaults?.diplomaUrl ?? "");
  const [certificateUrl, setCertificateUrl] = React.useState(
    defaults?.certificateUrl ?? "",
  );

  function toggleSpec(s: string) {
    setSpecs((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 8 ? [...prev, s] : prev,
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    startTransition(async () => {
      const save = onSave ?? saveDoctorProfileAction;
      const res = await save({
        firstName: get("firstName"),
        lastName: get("lastName"),
        clinic: get("clinic"),
        specializations: specs,
        city: get("city"),
        instagram: get("instagram"),
        website: get("website"),
        diplomaUrl,
        certificateUrl,
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setMessage(res.message ?? "Yadda saxlanıldı.");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}
      {message && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad" htmlFor="firstName" required>
          <Input id="firstName" name="firstName" defaultValue={defaults?.firstName} required placeholder="Adınız" />
        </Field>
        <Field label="Soyad" htmlFor="lastName" required>
          <Input id="lastName" name="lastName" defaultValue={defaults?.lastName} required placeholder="Soyadınız" />
        </Field>
      </div>

      <Field label="Telefon nömrəsi" htmlFor="phone" hint="Hesab identifikatoru — dəyişdirilə bilməz.">
        <Input id="phone" value={phone} disabled />
      </Field>

      {/* Specializations (multi-select) */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-800">
          İxtisas(lar){" "}
          <span className="font-normal text-slate-400">— bir və ya bir neçəsini seçin (istəyə bağlı)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {DENTAL_SPECIALIZATIONS.map((s) => {
            const active = specs.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpec(s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors",
                  active
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="İş yeri / Klinika" htmlFor="clinic">
          <Input id="clinic" name="clinic" defaultValue={defaults?.clinic} placeholder="Klinikanın adı" />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram" htmlFor="instagram" hint="Məs: @drsoyad və ya tam link">
          <Input id="instagram" name="instagram" defaultValue={defaults?.instagram} placeholder="@istifadeci_adi" />
        </Field>
        <Field label="Sayt" htmlFor="website">
          <Input id="website" name="website" type="url" defaultValue={defaults?.website} placeholder="https://..." />
        </Field>
      </div>

      {/* Document uploads */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FileUpload label="Diplom" value={diplomaUrl} onChange={setDiplomaUrl} onError={setError} />
        <FileUpload label="Təkmilləşmə sertifikatı" value={certificateUrl} onChange={setCertificateUrl} onError={setError} />
      </div>

      <p className="text-xs text-slate-400">
        Bütün əlavə məlumatlar istəyə bağlıdır. Diplom və sertifikat profilinizin
        etibarlılığını artırır (JPG, PNG və ya PDF — maks. 8 MB).
      </p>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? "Profili yarat" : "Yadda saxla"}
        </Button>
      </div>
    </form>
  );
}

function FileUpload({
  label,
  value,
  onChange,
  onError,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      onError("Fayl 8 MB-dan böyük olmamalıdır.");
      return;
    }
    setUploading(true);
    onError("");
    try {
      const blob = await upload(`doctor/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      onChange(blob.url);
    } catch (err) {
      onError(`Yükləmə uğursuz oldu: ${(err as Error).message}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-ink-800">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={onPick}
        className="hidden"
      />
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm font-medium text-emerald-800 hover:underline"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">Yükləndi — bax</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-600"
            aria-label="Sil"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Yüklənir...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Fayl seç
            </>
          )}
        </button>
      )}
    </div>
  );
}
