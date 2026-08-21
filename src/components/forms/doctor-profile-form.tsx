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
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/field";
import { SpecializationsPicker } from "@/components/forms/specializations-picker";
import { cn } from "@/lib/utils";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { saveDoctorProfileAction } from "@/app/hekim/actions";

type Option = { value: string; label: string };

export type DoctorFormDefaults = {
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  clinic?: string;
  specializations?: string[];
  portfolio?: string[];
  city?: string;
  photoUrl?: string;
  bannerUrl?: string;
  instagram?: string;
  website?: string;
  diplomaUrl?: string;
  certificateUrl?: string;
  residencyUrl?: string;
  internshipUrl?: string;
  specialtyUrl?: string;
  workplaceCenterId?: string;
  workplaceStatus?: string;
  careerStartYear?: number | null;
  education?: string[];
  courses?: string[];
  workHistory?: string[];
  expertise?: string[];
};

type SaveInput = {
  firstName: string;
  lastName: string;
  fatherName: string;
  clinic: string;
  specializations: string[];
  portfolio: string[];
  city: string;
  photoUrl: string;
  bannerUrl: string;
  instagram: string;
  website: string;
  diplomaUrl: string;
  certificateUrl: string;
  residencyUrl: string;
  internshipUrl: string;
  specialtyUrl: string;
  careerStartYear: number | null;
  education: string[];
  courses: string[];
  workHistory: string[];
  expertise: string[];
  workplaceCenterId: string;
};

export function DoctorProfileForm({
  cities,
  centers = [],
  phone,
  defaults,
  mode,
  onSave,
  locale = DEFAULT_LOCALE,
  allowPortfolio,
  allowBanner,
}: {
  cities: Option[];
  centers?: Option[];
  phone: string;
  defaults?: DoctorFormDefaults;
  mode: "create" | "edit";
  /** Overrides the default self-serve save (e.g. admin editing any doctor). */
  onSave?: (input: SaveInput) => Promise<{ ok: boolean; error?: string; message?: string }>;
  locale?: Locale;
  /** Whether the plan allows a work-sample portfolio (Silver+). */
  allowPortfolio?: boolean;
  /** Whether the plan allows a profile banner (Platinum). */
  allowBanner?: boolean;
}) {
  const t = getDict(locale).docForm;
  const ru = locale === "ru";
  const [pending, startTransition] = React.useTransition();
  const [portfolio, setPortfolio] = React.useState<string[]>(defaults?.portfolio ?? []);
  const [uploadingPortfolio, setUploadingPortfolio] = React.useState(false);
  const portfolioRef = React.useRef<HTMLInputElement>(null);

  async function onPickPortfolio(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingPortfolio(true);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, 12 - portfolio.length)) {
        const blob = await upload(`doctor-portfolio/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        uploaded.push(blob.url);
      }
      setPortfolio((prev) => [...prev, ...uploaded].slice(0, 12));
    } catch {
      /* best-effort */
    } finally {
      setUploadingPortfolio(false);
      if (portfolioRef.current) portfolioRef.current.value = "";
    }
  }
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [specs, setSpecs] = React.useState<string[]>(defaults?.specializations ?? []);
  const [photoUrl, setPhotoUrl] = React.useState(defaults?.photoUrl ?? "");
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const photoRef = React.useRef<HTMLInputElement>(null);
  const [bannerUrl, setBannerUrl] = React.useState(defaults?.bannerUrl ?? "");
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const bannerRef = React.useRef<HTMLInputElement>(null);
  const [diplomaUrl, setDiplomaUrl] = React.useState(defaults?.diplomaUrl ?? "");
  const [certificateUrl, setCertificateUrl] = React.useState(
    defaults?.certificateUrl ?? "",
  );
  const [residencyUrl, setResidencyUrl] = React.useState(defaults?.residencyUrl ?? "");
  const [internshipUrl, setInternshipUrl] = React.useState(defaults?.internshipUrl ?? "");
  const [specialtyUrl, setSpecialtyUrl] = React.useState(defaults?.specialtyUrl ?? "");
  const [workplaceCenterId, setWorkplaceCenterId] = React.useState(
    defaults?.workplaceCenterId ?? "",
  );
  // Show confirmation state only while the same center is still selected.
  const workplaceStatus =
    workplaceCenterId && workplaceCenterId === defaults?.workplaceCenterId
      ? defaults?.workplaceStatus
      : null;

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError(t.tooBig);
      return;
    }
    setUploadingPhoto(true);
    setError(null);
    try {
      const blob = await upload(`doctor-photos/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setPhotoUrl(blob.url);
    } catch (err) {
      setError(`${t.uploadFailed}: ${(err as Error).message}`);
    } finally {
      setUploadingPhoto(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  }

  async function onPickBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError(t.tooBig);
      return;
    }
    setUploadingBanner(true);
    setError(null);
    try {
      const blob = await upload(`doctor-banners/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setBannerUrl(blob.url);
    } catch (err) {
      setError(`${t.uploadFailed}: ${(err as Error).message}`);
    } finally {
      setUploadingBanner(false);
      if (bannerRef.current) bannerRef.current.value = "";
    }
  }

  function toggleSpec(s: string) {
    setSpecs((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 8 ? [...prev, s] : prev,
    );
  }

  /** Textarea → massiv: hər qeyri-boş sətir bir bənddir (2026-08-21). */
  const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);

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
        fatherName: get("fatherName"),
        clinic: get("clinic"),
        workplaceCenterId,
        specializations: specs,
        portfolio: allowPortfolio ? portfolio : [],
        bannerUrl: allowBanner ? bannerUrl : (defaults?.bannerUrl ?? ""),
        city: get("city"),
        photoUrl,
        instagram: get("instagram"),
        website: get("website"),
        diplomaUrl,
        certificateUrl,
        residencyUrl,
        internshipUrl,
        specialtyUrl,
        careerStartYear: get("careerStartYear") ? parseInt(get("careerStartYear"), 10) : null,
        education: lines(get("education")),
        courses: lines(get("courses")),
        workHistory: lines(get("workHistory")),
        expertise: lines(get("expertise")),
      });
      if (!res.ok) {
        setError(res.error ?? t.genericError);
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setMessage(res.message ?? t.savedOk);
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

      {/* Profile photo */}
      <div className="flex items-center gap-4">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-9 w-9 text-slate-300" />
          )}
        </span>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">{t.photo}</p>
          <input
            ref={photoRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            onChange={onPickPhoto}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              disabled={uploadingPhoto}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {t.photoUpload}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl("")}
                className="text-xs font-medium text-slate-400 hover:text-red-600"
              >
                {t.remove}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Platinum branding banner */}
      {allowBanner && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">
            Profil banneri <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">Platinum</span>{" "}
            <span className="font-normal text-slate-400">— tövsiyə olunan ölçü: 1920×480 px (4:1), JPG/PNG, maks 5 MB</span>
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="" className="h-28 w-full object-cover" />
            ) : (
              <div className="flex h-28 w-full items-center justify-center bg-slate-50 text-xs text-slate-400">
                Banner yüklənməyib (tövsiyə: 1920×500 — profil başlığının fonu olur)
              </div>
            )}
          </div>
          <input
            ref={bannerRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            onChange={onPickBanner}
            className="hidden"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {uploadingBanner ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {t.photoUpload}
            </button>
            {bannerUrl && (
              <button
                type="button"
                onClick={() => setBannerUrl("")}
                className="text-xs font-medium text-slate-400 hover:text-red-600"
              >
                {t.remove}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.firstName} htmlFor="firstName" required>
          <Input id="firstName" name="firstName" defaultValue={defaults?.firstName} required placeholder={t.firstNamePh} />
        </Field>
        <Field label={t.lastName} htmlFor="lastName" required>
          <Input id="lastName" name="lastName" defaultValue={defaults?.lastName} required placeholder={t.lastNamePh} />
        </Field>
        <Field label={ru ? "Отчество" : "Ata adı"} htmlFor="fatherName">
          <Input id="fatherName" name="fatherName" defaultValue={defaults?.fatherName} placeholder={ru ? "по желанию" : "istəyə bağlı"} />
        </Field>
      </div>

      <Field label={t.phone} htmlFor="phone" hint={t.phoneHint}>
        <Input id="phone" value={phone} disabled />
      </Field>

      {/* Specializations (multi-select) */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-800">
          {t.specs}{" "}
          <span className="font-normal text-slate-400">{t.specsHint}</span>
        </p>
        {/* 2026-08-19: siyahı genişləndi (40+ ixtisas) — çiplər əvəzinə
            axtarışlı seçici (fold-fuzzy: dəqiq yazmasa da tapır) */}
        <SpecializationsPicker value={specs} onChange={setSpecs} />
      </div>

      {/* Zəngin profil (2026-08-21): təcrübə + təhsil + kurslar + karyera +
          ekspertiza — hamısı sətir-sətir yazılır, profildə bullet olur */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
        <p className="text-sm font-semibold text-ink-800">
          {ru ? "Расширенный профиль" : "Zəngin profil"}{" "}
          <span className="font-normal text-slate-400">
            {ru ? "показывается пациентам в вашем профиле" : "pasiyentlərə profilinizdə göstərilir"}
          </span>
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field
            label={ru ? "Год начала деятельности" : "Fəaliyyətə başlama ili"}
            htmlFor="careerStartYear"
            hint={ru ? "для бейджа «Стаж: X лет»" : "«Təcrübə: X il» nişanı üçün"}
          >
            <Input
              id="careerStartYear"
              name="careerStartYear"
              type="number"
              min={1950}
              max={new Date().getFullYear()}
              defaultValue={defaults?.careerStartYear ?? ""}
              placeholder="2008"
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field
            label={ru ? "Образование" : "Təhsil"}
            htmlFor="education"
            hint={ru ? "каждая строка — отдельный пункт" : "hər sətir bir bənddir"}
          >
            <textarea
              id="education"
              name="education"
              rows={4}
              defaultValue={(defaults?.education ?? []).join("\n")}
              placeholder={"2003–2009 · Azərbaycan Tibb Universiteti — Müalicə işi\n2009–2010 · İnternatura — ..."}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400"
            />
          </Field>
          <Field
            label={ru ? "Курсы и конференции" : "Kurslar və konfranslar"}
            htmlFor="courses"
            hint={ru ? "каждая строка — отдельный пункт" : "hər sətir bir bənddir"}
          >
            <textarea
              id="courses"
              name="courses"
              rows={4}
              defaultValue={(defaults?.courses ?? []).join("\n")}
              placeholder={"2018 · «Sonsuzluğun müalicəsində müasir texnologiyalar» (Bakı)\n2021 · ..."}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400"
            />
          </Field>
          <Field
            label={ru ? "Опыт работы" : "İş təcrübəsi"}
            htmlFor="workHistory"
            hint={ru ? "каждая строка — отдельный пункт" : "hər sətir bir bənddir"}
          >
            <textarea
              id="workHistory"
              name="workHistory"
              rows={4}
              defaultValue={(defaults?.workHistory ?? []).join("\n")}
              placeholder={"2016 – indiyədək · Leyla Medical Center\n2010–2016 · ..."}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400"
            />
          </Field>
          <Field
            label={ru ? "Чем занимаюсь (экспертиза)" : "Nə ilə məşğulam (ekspertiza)"}
            htmlFor="expertise"
            hint={ru ? "процедуры, заболевания — по строке" : "prosedurlar, xəstəliklər — sətir-sətir"}
          >
            <textarea
              id="expertise"
              name="expertise"
              rows={4}
              defaultValue={(defaults?.expertise ?? []).join("\n")}
              placeholder={"İmplantasiya\nQapalı cərrahi əməliyyatlar\nOrtodontik müalicə"}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400"
            />
          </Field>
        </div>
      </div>

      {/* Portfolio (Silver+) */}
      {allowPortfolio && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">
            {ru ? "Портфолио (примеры работ)" : "Portfolio (iş nümunələri)"}{" "}
            <span className="font-normal text-slate-400">
              {ru ? "профиль" : "profilinizdə görünür"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {portfolio.map((p) => (
              <span key={p} className="group relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPortfolio((prev) => prev.filter((x) => x !== p))}
                  className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Sil"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {portfolio.length < 12 && (
              <>
                <input ref={portfolioRef} type="file" accept="image/*" multiple onChange={onPickPortfolio} className="hidden" />
                <button
                  type="button"
                  onClick={() => portfolioRef.current?.click()}
                  disabled={uploadingPortfolio}
                  className="inline-flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-brand-300 hover:text-brand-500 disabled:opacity-50"
                >
                  {uploadingPortfolio ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {centers.length > 0 && (
        <Field
          label="İş yeriniz sistemdə qeydiyyatlı mərkəzdirsə seçin"
          htmlFor="workplaceCenterId"
          hint="Seçdiyiniz mərkəz təsdiqlədikdən sonra profilinizdə link kimi görünəcək."
        >
          <Select
            id="workplaceCenterId"
            value={workplaceCenterId}
            onChange={(e) => setWorkplaceCenterId(e.target.value)}
          >
            <option value="">Seçilməyib (sərbəst yazı)</option>
            {centers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          {workplaceStatus === "PENDING" && (
            <p className="mt-1 text-xs font-medium text-amber-600">
              Mərkəzin təsdiqi gözlənilir.
            </p>
          )}
          {workplaceStatus === "ACCEPTED" && (
            <p className="mt-1 text-xs font-medium text-emerald-600">
              Mərkəz təsdiqlədi ✓ — profilinizdə link kimi görünür.
            </p>
          )}
          {workplaceStatus === "REJECTED" && (
            <p className="mt-1 text-xs font-medium text-red-600">
              Mərkəz təsdiqləmədi.
            </p>
          )}
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.clinic} htmlFor="clinic">
          <Input id="clinic" name="clinic" defaultValue={defaults?.clinic} placeholder={t.clinicPh} />
        </Field>
        <Field label={t.city} htmlFor="city">
          <Select id="city" name="city" defaultValue={defaults?.city ?? ""}>
            <option value="">{t.choose}</option>
            {cities.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.instagram} htmlFor="instagram" hint={t.instagramHint}>
          <Input id="instagram" name="instagram" defaultValue={defaults?.instagram} placeholder="@istifadeci_adi" />
        </Field>
        <Field label={t.website} htmlFor="website">
          <Input id="website" name="website" type="url" defaultValue={defaults?.website} placeholder="https://..." />
        </Field>
      </div>

      {/* Document uploads */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FileUpload label={t.diploma} value={diplomaUrl} onChange={setDiplomaUrl} onError={setError} t={t} />
        <FileUpload label={t.certificate} value={certificateUrl} onChange={setCertificateUrl} onError={setError} t={t} />
        <FileUpload label={t.residency} value={residencyUrl} onChange={setResidencyUrl} onError={setError} t={t} />
        <FileUpload label={t.internship} value={internshipUrl} onChange={setInternshipUrl} onError={setError} t={t} />
        <FileUpload label={t.specialty} value={specialtyUrl} onChange={setSpecialtyUrl} onError={setError} t={t} />
      </div>

      <p className="text-xs text-slate-400">{t.docsNote}</p>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? t.create : t.save}
        </Button>
      </div>
    </form>
  );
}

type DocFormDict = ReturnType<typeof getDict>["docForm"];

function FileUpload({
  label,
  value,
  onChange,
  onError,
  t,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
  t: DocFormDict;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      onError(t.tooBig);
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
      onError(`${t.uploadFailed}: ${(err as Error).message}`);
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
            <span className="truncate">{t.uploaded}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-600"
            aria-label={t.remove}
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
              <Loader2 className="h-4 w-4 animate-spin" /> {t.uploading}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> {t.pickFile}
            </>
          )}
        </button>
      )}
    </div>
  );
}
