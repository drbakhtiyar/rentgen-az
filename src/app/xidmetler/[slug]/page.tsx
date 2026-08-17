import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ArrowRight, ListChecks, HelpCircle } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { SERVICE_ICON_URLS } from "@/lib/service-icon-map";
import { ServiceIconVisual } from "@/components/service-icon-visual";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ServiceIcon } from "@/components/ui/service-icon";
import { ServiceCenterRows } from "@/components/centers/service-center-rows";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/ui/json-ld";
import {
  getActiveServices,
  getServiceBySlug,
  getCentersForService,
  getRatingsForCenters,
  getServicePriceRanges,
} from "@/lib/queries";
import { getServiceContent } from "@/content/services";
import { serviceNameRu, categoryRu } from "@/content/services-ru";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
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
  const locale = await getLocale();
  const name = locale === "ru" ? serviceNameRu(service.name) : service.name;
  const content = getServiceContent(slug, name, service.category ?? undefined, locale);
  // 2026-08-18 SEO: real qiymət aralığı varsa title-a düşür («qiyməti» sorğuları)
  const range = (await getServicePriceRanges())[slug];
  const priceTitle = range
    ? locale === "ru"
      ? `${name} — цена ${range.min}${range.max > range.min ? `–${range.max}` : ""} ₼ | центры в Баку`
      : `${name} qiyməti — ${range.min}${range.max > range.min ? `–${range.max}` : ""} ₼ | Bakıda mərkəzlər`
    : null;
  return buildMetadata({
    title: priceTitle ?? content.metaTitle.replace(/ \| .*$/, ""),
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

  const locale = await getLocale();
  const ru = locale === "ru";
  const displayName = ru ? serviceNameRu(service.name) : service.name;
  const shortName = ru ? displayName : (service.shortName ?? service.name);
  const displayCategory = ru ? categoryRu(service.category) : (service.category ?? undefined);
  const content = getServiceContent(slug, displayName, service.category ?? undefined, locale);
  // 2026-08-18: limitsiz çəkilir — kəsim SORTDAN SONRA (qiymətlilər itməsin)
  const centersRaw = await getCentersForService(slug);
  const svcOf = (c: (typeof centersRaw)[number]) =>
    c.services.find((cs) => cs.service.slug === slug);
  const priceOf = (c: (typeof centersRaw)[number]) => svcOf(c)?.price ?? null;
  const sorted = [...centersRaw].sort((a, b) => {
    const pa = priceOf(a);
    const pb = priceOf(b);
    if (pa == null && pb == null) return 0;
    if (pa == null) return 1;
    if (pb == null) return -1;
    return pa - pb;
  });
  // Qiymətlilərin HAMISI + qiymətsizlərdən maksimum 15 sətir; qalanı kataloqda
  const priced = sorted.filter((c) => priceOf(c) != null);
  const unpriced = sorted.filter((c) => priceOf(c) == null).slice(0, 15);
  const centers = [...priced, ...unpriced];
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));
  const allServices = await getActiveServices();
  const t = getDict(locale).serviceDetail;
  const related = allServices
    .filter((s) => s.slug !== slug && s.category === service.category)
    .slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: ru ? "Главная" : "Ana səhifə", path: "/" },
            { name: ru ? "Услуги" : "Xidmətlər", path: "/xidmetler" },
            { name: displayName, path: `/xidmetler/${slug}` },
          ]),
          serviceJsonLd({
            name: displayName,
            slug,
            description: content.intro,
            priceMin: priced[0] ? priceOf(priced[0]) : null,
            priceMax: priced.length
              ? Math.max(...priced.map((c) => svcOf(c)?.priceTo ?? priceOf(c) ?? 0))
              : null,
            offerCount: priced.length || undefined,
          }),
          faqJsonLd(content.faq),
        ]}
      />

      <PageHeader
        eyebrow={displayCategory || undefined}
        title={displayName}
        description={content.intro}
        visual={
          SERVICE_ICON_URLS[slug] ? (
            <ServiceIconVisual url={SERVICE_ICON_URLS[slug]} alt={displayName} />
          ) : undefined
        }
        breadcrumbs={[
          { name: ru ? "Услуги" : "Xidmətlər", href: "/xidmetler" },
          { name: shortName },
        ]}
      >
        <ButtonLink href={`/rentgen-merkezleri?service=${slug}`} variant="primary">
          {t.centersWithService} <ArrowRight className="h-4 w-4" />
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
                  <ListChecks className="h-5 w-5 text-brand-600" /> {t.benefits}
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
                {SERVICE_ICON_URLS[slug] ? (
                  /* Premium anatomik ikon (2026-08-14) — eyni 48px çərçivədə */
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#0d1330] ring-1 ring-iris-border">
                    <Image
                      src={SERVICE_ICON_URLS[slug]}
                      alt={displayName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <ServiceIcon name={service.icon} url={service.iconUrl} className="h-6 w-6" />
                  </div>
                )}
                <h3 className="font-display mt-4 text-base font-bold text-ink-900">
                  {t.whenNeeded}
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
                    {t.related}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {related.map((r) => (
                      <li key={r.slug}>
                        <Link
                          href={`/xidmetler/${r.slug}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {ru ? serviceNameRu(r.name) : (r.shortName ?? r.name)}
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
              eyebrow={t.centersEyebrow}
              title={t.centersTitleTpl.replace("{s}", shortName)}
            />
            <ButtonLink href={`/rentgen-merkezleri?service=${slug}`} variant="outline" className="shrink-0">
              {t.viewAll} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          {centers.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              {locale === "ru"
                ? "Отсортировано по цене — самые выгодные предложения сверху."
                : "Qiymətə görə sıralanıb — ən sərfəli təkliflər yuxarıda."}
            </p>
          )}
          {centers.length > 0 ? (
            /* 2026-08-18: kart şəbəkəsi → kompakt sıra-siyahı (analizler.az
               nümunəsi) — müqayisə və axtarış üçün daha rahatdır */
            <ServiceCenterRows
              locale={locale}
              rows={centers.map((c) => ({
                id: c.id,
                slug: c.slug,
                name: c.name,
                city: c.city,
                logoUrl: c.logoUrl,
                phone: c.phone,
                whatsapp: c.whatsapp,
                price: priceOf(c),
                priceTo: svcOf(c)?.priceTo ?? null,
                googleRating: ratings[c.id]?.count ? ratings[c.id].avg : (c.googleRating ?? null),
              }))}
            />
          ) : (
            <Card className="mt-8 p-10 text-center">
              <p className="text-slate-600">
                {t.centersEmpty}
              </p>
              <ButtonLink href="/merkezler-ucun" className="mt-5">
                {t.addCenter}
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
              title={t.faqTitleTpl.replace("{s}", shortName)}
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
                {t.ctaTitleTpl.replace("{s}", shortName)}
              </h2>
              <p className="mt-3 text-slate-300">
                {t.ctaDesc}
              </p>
              <ButtonLink
                href={`/rentgen-merkezleri?service=${slug}`}
                variant="primary"
                size="lg"
                className="mt-6"
              >
                {t.findCenter}
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
