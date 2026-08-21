import Link from "next/link";
import Image from "next/image";
import { Stethoscope, MapPin, BadgeCheck, ArrowUpRight, Clock, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { doctorName } from "@/lib/utils";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export type DoctorCardData = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  clinic: string | null;
  city: string | null;
  specializations: string[];
  photoUrl: string | null;
  diplomaUrl: string | null;
  certificateUrl: string | null;
  plan?: string; // PLATINUM → highlighted card
  careerStartYear?: number | null; // «Təcrübə: X il» nişanı (2026-08-21)
  education?: string[];
};

export function DoctorCard({
  doctor,
  locale = DEFAULT_LOCALE,
}: {
  doctor: DoctorCardData;
  locale?: Locale;
}) {
  const name = doctorName(doctor.firstName, doctor.lastName);
  const verified = Boolean(doctor.diplomaUrl || doctor.certificateUrl);
  const specs = doctor.specializations.slice(0, 3);
  const extra = doctor.specializations.length - specs.length;
  const premium = doctor.plan === "PLATINUM"; // "tam brendinq" — vurğulanmış kart
  const expYears = doctor.careerStartYear
    ? Math.max(0, new Date().getFullYear() - doctor.careerStartYear)
    : null;
  const eduLine = doctor.education?.[0] ?? null;

  return (
    <Card
      className={`group relative flex h-full flex-col rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(64,60,213,0.35)] ${
        premium
          ? "border-iris-veil/40 ring-1 ring-inset ring-iris-veil/30 hover:border-iris-veil/60"
          : "border-ash-2 hover:border-iris-veil/50"
      }`}
    >
      {premium && (
        <span className="absolute right-3 top-3 rounded-full bg-iris-pulse px-2 py-0.5 text-[10px] font-semibold shadow-[0_0_16px_rgba(60,57,185,0.45)] uppercase tracking-wide text-white">
          Premium
        </span>
      )}
      {expYears !== null && expYears > 0 && (
        <span className={`absolute right-3 inline-flex items-center gap-1 rounded-full bg-iris-glow/10 px-2 py-0.5 text-[11px] font-semibold text-iris-glow ${premium ? "top-9" : "top-3"}`}>
          <Clock className="h-3 w-3" /> {expYears} il
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-iris-glow/10 text-iris-pulse ring-1 ring-iris-veil/25">
          {doctor.photoUrl ? (
            <Image
              src={doctor.photoUrl}
              alt={name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <Stethoscope className="h-6 w-6" />
          )}
        </span>
        <div className="min-w-0">
          <Link href={`/hekimler/${doctor.id}`} className="group/link">
            <h3 className="flex items-center gap-1.5 font-display text-base font-semibold text-iris-canvas transition-colors group-hover/link:text-iris-pulse">
              {name}
              {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-iris-pulse" />}
            </h3>
          </Link>
          {doctor.clinic && (
            <p className="mt-0.5 truncate text-sm text-slate-500">{doctor.clinic}</p>
          )}
          {doctor.city && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {doctor.city}
            </p>
          )}
        </div>
      </div>

      {specs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {specs.map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-full border border-iris-veil/30 bg-iris-glow/8 px-2.5 py-0.5 text-xs font-medium text-iris-glow"
            >
              {s}
            </span>
          ))}
          {extra > 0 && (
            <span className="inline-flex items-center rounded-full bg-pearl px-2.5 py-0.5 text-xs font-medium text-fog-2">
              +{extra}
            </span>
          )}
        </div>
      )}

      {eduLine && (
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
          <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2">{eduLine}</span>
        </p>
      )}

      <Link
        href={`/hekimler/${doctor.id}`}
        className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-iris-pulse hover:text-iris-glow"
      >
        {getDict(locale).doctors.viewProfile} <ArrowUpRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
