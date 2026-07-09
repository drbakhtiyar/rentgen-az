import type { Metadata } from "next";
import {
  Building2,
  CheckCircle2,
  TrendingUp,
  Phone,
  ClipboardList,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Rentgen mərkəzləri üçün — platformaya qoşulun",
  description:
    "Rentgen mərkəzinizi Rentgen.az platformasına əlavə edin, xidmət və qiymətlərinizi göstərin, admin təsdiqindən sonra pasiyentlərə görünün.",
  path: "/merkezler-ucun",
  keywords: ["rentgen mərkəzi qeydiyyat", "dental rentgen mərkəzi", "Bakı rentgen"],
});

export default async function CentersForPage() {
  const fc = getDict(await getLocale()).forCenters;
  const steps = [
    { icon: <Phone />, t: fc.step1t, d: fc.step1d },
    { icon: <ClipboardList />, t: fc.step2t, d: fc.step2d },
    { icon: <BadgeCheck />, t: fc.step3t, d: fc.step3d },
    { icon: <TrendingUp />, t: fc.step4t, d: fc.step4d },
  ];
  const benefits = [fc.b1, fc.b2, fc.b3, fc.b4, fc.b5, fc.b6];
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Mərkəzlər üçün", path: "/merkezler-ucun" },
        ])}
      />
      <PageHeader
        eyebrow={fc.eyebrow}
        title={fc.title}
        description={fc.description}
        breadcrumbs={[{ name: fc.eyebrow }]}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/giris?role=center" variant="primary" size="lg">
            {fc.registerCta} <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink
            href="/giris?role=center"
            variant="outline"
            size="lg"
            className="border-white/30 bg-white/5 text-white hover:bg-white/10"
          >
            {fc.loginCta}
          </ButtonLink>
        </div>
      </PageHeader>

      <Section className="py-12">
        <Container>
          <SectionHeading eyebrow={fc.howEyebrow} title={fc.howTitle} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Card key={i} className="relative p-6">
                <span className="absolute right-4 top-4 font-display text-3xl font-bold text-brand-50">
                  {i + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 [&>svg]:h-6 [&>svg]:w-6">
                  {s.icon}
                </span>
                <h3 className="font-display mt-4 text-base font-bold text-ink-900">
                  {s.t}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{s.d}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-surface py-12">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                align="left"
                eyebrow={fc.benefitsEyebrow}
                title={fc.benefitsTitle}
                description={fc.benefitsDesc}
              />
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <Card className="relative overflow-hidden bg-ink-950 p-8 text-white">
              <div className="absolute inset-0 bg-grid-dark opacity-40" />
              <div className="glow-cyan absolute -right-10 -top-10 h-56 w-56 opacity-50" />
              <div className="relative">
                <Building2 className="h-10 w-10 text-cyan-400" />
                <h3 className="font-display mt-4 text-2xl font-bold">
                  {fc.freeTitle}
                </h3>
                <p className="mt-3 text-slate-300">
                  {fc.freeDesc}
                </p>
                <ButtonLink href="/giris?role=center" variant="primary" className="mt-6">
                  {fc.freeCta} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
