import Link from "next/link";
import Image from "next/image";
import { Stethoscope, MapPin, BadgeCheck, ArrowUpRight } from "lucide-react";
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

  return (
    <Card
      className={`group relative flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] ${
        premium
          ? "border-cyan-200 ring-1 ring-inset ring-cyan-100 hover:border-cyan-300"
          : "hover:border-brand-200"
      }`}
    >
      {premium && (
        <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-cyan-500 to-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Premium
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
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
            <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-ink-900 transition-colors group-hover/link:text-brand-700">
              {name}
              {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" />}
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
            <Badge key={s} tone="cyan">
              {s}
            </Badge>
          ))}
          {extra > 0 && <Badge tone="slate">+{extra}</Badge>}
        </div>
      )}

      <Link
        href={`/hekimler/${doctor.id}`}
        className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        {getDict(locale).doctors.viewProfile} <ArrowUpRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
