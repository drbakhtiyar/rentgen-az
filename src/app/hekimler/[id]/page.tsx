import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Stethoscope, MapPin, BadgeCheck, AtSign, Globe, ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { getApprovedDoctorById } from "@/lib/queries";
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

  const name = doctorName(doctor.firstName, doctor.lastName);
  const verified = Boolean(doctor.diplomaUrl || doctor.certificateUrl);
  const instagramUrl = doctor.instagram
    ? doctor.instagram.startsWith("http")
      ? doctor.instagram
      : `https://instagram.com/${doctor.instagram.replace(/^@/, "")}`
    : null;

  return (
    <>
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
        eyebrow="Dental həkim"
        title={name}
        breadcrumbs={[{ name: "Həkimlər", href: "/hekimler" }, { name }]}
      >
        <div className="flex flex-wrap items-center gap-3">
          {verified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-cyan-300">
              <BadgeCheck className="h-4 w-4" /> Sənədləri təsdiqlənib
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
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
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
                  </span>
                  <div>
                    <h1 className="font-display text-2xl font-bold text-ink-900">{name}</h1>
                    {doctor.clinic && (
                      <p className="mt-1 text-slate-600">{doctor.clinic}</p>
                    )}
                  </div>
                </div>

                {doctor.specializations.length > 0 && (
                  <div className="mt-5">
                    <h2 className="text-sm font-semibold text-ink-800">İxtisaslar</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {doctor.specializations.map((s) => (
                        <Badge key={s} tone="cyan">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(instagramUrl || doctor.website) && (
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
                        <Globe className="h-4 w-4" /> Vebsayt
                      </a>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <aside className="space-y-6">
              <Card className="p-6">
                <h3 className="font-display text-base font-bold text-ink-900">
                  Rentgen müayinəsi lazımdır?
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Təsdiqlənmiş rentgen mərkəzlərini tapın və birbaşa əlaqə saxlayın.
                </p>
                <ButtonLink href="/rentgen-merkezleri" className="mt-4 w-full">
                  Mərkəz tap <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
