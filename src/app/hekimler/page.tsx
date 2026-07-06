import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { getApprovedDoctors } from "@/lib/queries";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Həkimlər — dental həkim kataloqu",
  description:
    "Azərbaycanda dental həkimlər: ixtisas, klinika və şəhərə görə tapın. Təsdiqlənmiş həkim profilləri — Rentgen.az.",
  path: "/hekimler",
  keywords: ["dental həkim", "diş həkimi", "ortodont", "implantoloq", "Bakı həkim"],
});

export default async function DoctorsPage() {
  const [doctors, locale] = await Promise.all([getApprovedDoctors(), getLocale()]);
  const t = getDict(locale).doctors;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: t.title, path: "/hekimler" },
        ])}
      />
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        breadcrumbs={[{ name: t.title }]}
      />

      <Section className="py-12">
        <Container>
          {doctors.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} locale={locale} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="font-display mt-4 text-xl font-bold text-ink-900">
                {t.empty}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                {t.emptyDesc}
              </p>
              <ButtonLink href="/hekimler-ucun" className="mt-6">
                {t.joinCta}
              </ButtonLink>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
