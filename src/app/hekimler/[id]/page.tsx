import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Stethoscope, MapPin, BadgeCheck, AtSign, Globe, ArrowRight, ArrowUpRight, Clock, GraduationCap, Award, Briefcase, ListChecks } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { getApprovedDoctorById } from "@/lib/queries";
import { DocumentGallery } from "@/components/documents/document-gallery";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { doctorLimits } from "@/lib/plans";
import { TrackDoctorView } from "@/components/doctors/track-doctor-view";
import { doctorName } from "@/lib/utils";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getApprovedDoctorById(id);
  if (!doctor) return buildMetadata({ title: "Həkim tapılmadı", noIndex: true });
  const name = doctorName(doctor.firstName, doctor.lastName);
  const specs = doctor.specializations.join(", ");
  return buildMetadata({
    title: `${name}${doctor.city ? ` — ${doctor.city}` : ""}`,
    description: `${name}${specs ? ` — ${specs}` : " — dental həkim"}${
      doctor.clinic ? `, ${doctor.clinic}` : ""
    }. Rentgen.az həkim kataloqu.`,
    path: `/hekimler/${id}`,
    keywords: [name, ...doctor.specializations, "dental həkim", doctor.city ?? "Bakı"],
  });
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getApprovedDoctorById(id);
  if (!doctor) notFound();

  const locale = await getLocale();
  const t = getDict(locale).doctors;
  const name = doctorName(doctor.firstName, doctor.lastName);
  const verified = Boolean(doctor.diplomaUrl || doctor.certificateUrl);
  // Confirmed registered workplace → link to that center.
  const workplaceCenter =
    doctor.workplaceStatus === "ACCEPTED" && doctor.workplaceCenter?.status === "APPROVED"
      ? doctor.workplaceCenter
      : null;
  // Təcrübə ili (2026-08-21): fəaliyyətə başlama ilindən avtomatik hesablanır
  const expYears = doctor.careerStartYear
    ? Math.max(0, new Date().getFullYear() - doctor.careerStartYear)
    : null;
  const ru = locale === "ru";
  const instagramUrl = doctor.instagram
    ? doctor.instagram.startsWith("http")
      ? doctor.instagram
      : `https://instagram.com/${doctor.instagram.replace(/^@/, "")}`
    : null;

  return (
    <>
      <TrackDoctorView doctorId={doctor.id} />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Ana səhifə", path: "/" },
            { name: "Həkimlər", path: "/hekimler" },
            { name, path: `/hekimler/${id}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Physician",
            name,
            medicalSpecialty: doctor.specializations,
            ...(doctor.clinic ? { worksFor: { "@type": "MedicalClinic", name: doctor.clinic } } : {}),
            ...(doctor.city ? { areaServed: doctor.city } : {}),
          },
        ]}
      />

      <PageHeader
        eyebrow={t.profileEyebrow}
        title={name}
        breadcrumbs={[{ name: "Həkimlər", href: "/hekimler" }, { name }]}
        bgImageUrl={
          doctorLimits(doctor.plan).banner && doctor.bannerUrl ? doctor.bannerUrl : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          {verified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-cyan-300">
              <BadgeCheck className="h-4 w-4" /> {t.verified}
            </span>
          )}
          {expYears !== null && expYears > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
              <Clock className="h-4 w-4 text-cyan-300" /> {ru ? `Стаж: ${expYears} лет` : `Təcrübə: ${expYears} il`}
            </span>
          )}
          {doctor.city && (
            <span className="flex items-center gap-1.5 text-sm text-slate-300">
              <MapPin className="h-4 w-4 text-cyan-400" /> {doctor.city}
            </span>
          )}
        </div>
      </PageHeader>

      <Section className="py-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    {doctor.photoUrl ? (
                      <Image
                        src={doctor.photoUrl}
                        alt={name}
                        width={64}
                        height={64}
                        priority
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Stethoscope className="h-8 w-8" />
                    )}
                    {verified && (
                      <span className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow" title="Təsdiqlənmiş həkim">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </span>
                  <div>
                    <h1 className="font-display text-2xl font-bold text-ink-900">{name}</h1>
                    {workplaceCenter ? (
                      <Link
                        href={`/rentgen-merkezleri/${workplaceCenter.slug}`}
                        className="mt-1 inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                      >
                        {workplaceCenter.name}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      doctor.clinic && <p className="mt-1 text-slate-600">{doctor.clinic}</p>
                    )}
                  </div>
                </div>

                {doctor.specializations.length > 0 && (
                  <div className="mt-5">
                    <h2 className="text-sm font-semibold text-ink-800">{t.specializations}</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {doctor.specializations.map((s) => (
                        <Badge key={s} tone="cyan">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <DocumentGallery
                  title={t.documents}
                  docs={[
                    { label: "Diplom", url: doctor.diplomaUrl },
                    { label: "Sertifikat", url: doctor.certificateUrl },
                    { label: "Rezidentura", url: doctor.residencyUrl },
                    { label: "İnternatura", url: doctor.internshipUrl },
                    { label: "Uzmanlıq", url: doctor.specialtyUrl },
                  ].filter((d): d is { label: string; url: string } => !!d.url)}
                />

                {doctorLimits(doctor.plan).branding && (instagramUrl || doctor.website) && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {instagramUrl && (
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        <AtSign className="h-4 w-4" /> Instagram
                      </a>
                    )}
                    {doctor.website && (
                      <a
                        href={doctor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        <Globe className="h-4 w-4" /> {t.website}
                      </a>
                    )}
                  </div>
                )}
              </Card>

              {/* Ekspertiza — nə ilə məşğuldur (2026-08-21 zəngin profil) */}
              {doctor.expertise.length > 0 && (
                <Card className="p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                    <ListChecks className="h-5 w-5 text-brand-500" />
                    {ru ? "Чем занимается врач" : "Həkim nə ilə məşğuldur"}
                  </h2>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {doctor.expertise.map((e) => (
                      <li key={e} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* İş təcrübəsi */}
              {doctor.workHistory.length > 0 && (
                <Card className="p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                    <Briefcase className="h-5 w-5 text-brand-500" />
                    {ru ? "Опыт работы" : "İş təcrübəsi"}
                  </h2>
                  <ul className="mt-4 space-y-2.5">
                    {doctor.workHistory.map((w) => (
                      <li key={w} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {doctorLimits(doctor.plan).portfolio && doctor.portfolio.length > 0 && (
                <Card className="mt-6 p-6">
                  <h2 className="font-display text-lg font-bold text-ink-900">
                    {locale === "ru" ? "Портфолио" : "Portfolio"}
                  </h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {doctor.portfolio.map((p) => (
                      <a
                        key={p}
                        href={p}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square overflow-hidden rounded-xl ring-1 ring-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <aside className="space-y-6">
              {/* Təhsil (2026-08-21 zəngin profil) */}
              {doctor.education.length > 0 && (
                <Card className="p-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                    <GraduationCap className="h-4 w-4 text-brand-500" /> {ru ? "Образование" : "Təhsil"}
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {doctor.education.map((e) => (
                      <li key={e} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Kurslar və konfranslar */}
              {doctor.courses.length > 0 && (
                <Card className="p-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                    <Award className="h-4 w-4 text-brand-500" /> {ru ? "Курсы и конференции" : "Kurslar və konfranslar"}
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {doctor.courses.map((c) => (
                      <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card className="p-6">
                <h3 className="font-display text-base font-bold text-ink-900">
                  {t.needXray}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {t.needXrayDesc}
                </p>
                <ButtonLink href="/rentgen-merkezleri" className="mt-4 w-full">
                  {t.findCenter} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
