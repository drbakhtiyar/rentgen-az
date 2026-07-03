import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ListChecks, HelpCircle } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ServiceIcon } from "@/components/ui/service-icon";
import { CenterCard } from "@/components/centers/center-card";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/ui/json-ld";
import {
  getActiveServices,
  getServiceBySlug,
  getCentersForService,
  getRatingsForCenters,
} from "@/lib/queries";
import { getServiceContent } from "@/content/services";
import {
  buildMetadata,
  breadcrumbJsonLd,
  faqJsonLd,
  serviceJsonLd,
} from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const services = await getActiveServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return buildMetadata({ title: "Xidmət tapılmadı", noIndex: true });
  const content = getServiceContent(slug, service.name);
  return buildMetadata({
    title: content.metaTitle.replace(/ \| .*$/, ""),
    description: content.metaDescription,
    path: `/xidmetler/${slug}`,
    keywords: content.keywords,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const shortName = service.shortName ?? service.name;
  const content = getServiceContent(slug, service.name);
  const centers = await getCentersForService(slug, 9);
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));
  const allServices = await getActiveServices();
  const related = allServices
    .filter((s) => s.slug !== slug && s.category === service.category)
    .slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Ana səhifə", path: "/" },
            { name: "Xidmətlər", path: "/xidmetler" },
            { name: service.name, path: `/xidmetler/${slug}` },
          ]),
          serviceJsonLd({ name: service.name, slug, description: content.intro }),
          faqJsonLd(content.faq),
        ]}
      />

      <PageHeader
        eyebrow={service.category ?? undefined}
        title={service.name}
        description={content.intro}
        breadcrumbs={[
          { name: "Xidmətlər", href: "/xidmetler" },
          { name: shortName },
        ]}
      >
        <ButtonLink href={`/rentgen-merkezleri?service=${slug}`} variant="primary">
          Bu xidməti göstərən mərkəzlər <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </PageHeader>

      <Section className="py-12">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <article className="space-y-8">
              {content.sections.map((sec, i) => (
                <div key={i}>
                  <h2 className="font-display text-2xl font-bold text-ink-900">
                    {sec.heading}
                  </h2>
                  <p className="mt-3 leading-relaxed text-slate-600">{sec.body}</p>
                </div>
              ))}

              <Card className="p-6">
                <h2 className="font-display flex items-center gap-2 text-xl font-bold text-ink-900">
                  <ListChecks className="h-5 w-5 text-brand-600" /> Üstünlükləri
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {content.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              </Card>
            </article>

            <aside className="space-y-6">
              <Card className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <ServiceIcon name={service.icon} url={service.iconUrl} className="h-6 w-6" />
                </div>
                <h3 className="font-display mt-4 text-base font-bold text-ink-900">
                  Hansı hallarda lazımdır?
                </h3>
                <ul className="mt-3 space-y-2">
                  {content.whenNeeded.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {w}
                    </li>
                  ))}
                </ul>
              </Card>

              {related.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-display text-base font-bold text-ink-900">
                    Əlaqəli xidmətlər
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {related.map((r) => (
                      <li key={r.slug}>
                        <Link
                          href={`/xidmetler/${r.slug}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {r.shortName ?? r.name}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </aside>
          </div>
        </Container>
      </Section>

      {/* Centers offering this service */}
      <Section className="bg-surface py-12">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              align="left"
              eyebrow="Mərkəzlər"
              title={`${shortName} xidməti göstərən mərkəzlər`}
            />
            <ButtonLink href={`/rentgen-merkezleri?service=${slug}`} variant="outline" className="shrink-0">
              Hamısına bax <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          {centers.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {centers.map((c) => (
                <CenterCard
                  key={c.id}
                  center={c}
                  rating={ratings[c.id]}
                  highlightService={slug}
                />
              ))}
            </div>
          ) : (
            <Card className="mt-8 p-10 text-center">
              <p className="text-slate-600">
                Bu xidmət üzrə təsdiqlənmiş mərkəzlər tezliklə əlavə olunacaq.
              </p>
              <ButtonLink href="/merkezler-ucun" className="mt-5">
                Mərkəzinizi əlavə edin
              </ButtonLink>
            </Card>
          )}
        </Container>
      </Section>

      {/* FAQ */}
      {content.faq.length > 0 && (
        <Section className="py-12">
          <Container>
            <SectionHeading
              eyebrow="FAQ"
              title={`${shortName} haqqında suallar`}
            />
            <div className="mt-8">
              <FaqAccordion items={content.faq} />
            </div>
          </Container>
        </Section>
      )}

      {/* CTA */}
      <Section className="pb-20 pt-4">
        <Container>
          <Card className="relative overflow-hidden bg-ink-950 p-10 text-center text-white">
            <div className="absolute inset-0 bg-grid-dark opacity-30" />
            <div className="relative mx-auto max-w-xl">
              <HelpCircle className="mx-auto h-8 w-8 text-cyan-400" />
              <h2 className="font-display mt-4 text-2xl font-bold">
                {shortName} üçün mərkəz axtarırsınız?
              </h2>
              <p className="mt-3 text-slate-300">
                Təsdiqlənmiş mərkəzləri rayona görə tapın və birbaşa əlaqə saxlayın.
              </p>
              <ButtonLink
                href={`/rentgen-merkezleri?service=${slug}`}
                variant="primary"
                size="lg"
                className="mt-6"
              >
                Mərkəz tap
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
