import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/ui/json-ld";
import { CentersExplorer } from "@/components/map/centers-explorer";
import { getApprovedCenters, getRatingsForCenters } from "@/lib/queries";
import { getCityServicePage, getCityServicePages, getServicesForCity } from "@/lib/city-service-pages";
import { getCityStats } from "@/lib/city-pages";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { parseSort, combinedRatingScore } from "@/lib/rating";
import { locative } from "@/lib/center-description";
import { serviceNameRu, categoryRu } from "@/content/services-ru";

export const revalidate = 300;

export async function generateStaticParams() {
  const pages = await getCityServicePages();
  return pages.map((p) => ({ slug: p.city.slug, service: p.service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; service: string }>;
}): Promise<Metadata> {
  const { slug, service } = await params;
  const page = await getCityServicePage(slug, service).catch(() => null);
  if (!page) return buildMetadata({ title: "Səhifə tapılmadı", noIndex: true });

  // Başlıqda TAM ad: shortName tək başına yarımçıq oxunur ("Bakıda Panoramik").
  const svc = page.service.name;
  // /ru altında meta rusca (əvvəllər hər iki dildə AZ idi — SEO siqnal qarışıqlığı)
  const locale = await getLocale();
  if (locale === "ru") {
    const svcRu = serviceNameRu(svc);
    return buildMetadata({
      title: `${svcRu} — ${page.city.name}`,
      description:
        `${page.count} центров города ${page.city.name}, где выполняется «${svcRu}». ` +
        `Адреса, график работы, контакты и рейтинги — rentgen.az.`,
      path: `/rentgen-merkezleri/sheher/${page.city.slug}/${page.service.slug}`,
      keywords: [
        `${svcRu} ${page.city.name}`,
        `${svcRu} цена`,
        `${page.city.name} диагностика`,
      ],
    });
  }
  return buildMetadata({
    title: `${locative(page.city.name)} ${svc}`,
    description:
      `${locative(page.city.name)} ${svc} xidməti göstərən ${page.count} mərkəz. ` +
      `Ünvan, iş saatı, əlaqə nömrəsi və reytinqlər — rentgen.az.`,
    path: `/rentgen-merkezleri/sheher/${page.city.slug}/${page.service.slug}`,
    keywords: [
      `${locative(page.city.name)} ${svc}`,
      `${page.city.name} ${svc}`,
      `${svc} qiyməti`,
      `${page.city.name} diaqnostika`,
    ],
  });
}

export default async function CityServicePage({
  params,
}: {
  params: Promise<{ slug: string; service: string }>;
}) {
  const { slug, service } = await params;
  const page = await getCityServicePage(slug, service);
  if (!page) notFound();

  const [centers, stats, siblings] = await Promise.all([
    getApprovedCenters({ city: page.city.name, service: page.service.slug, take: 200 }),
    getCityStats(page.city.name),
    getServicesForCity(page.city.name, 14),
  ]);
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));
  const sorted = [...centers].sort(
    (a, b) =>
      combinedRatingScore(ratings[b.id], b.googleRating, b.googleReviewCount) -
      combinedRatingScore(ratings[a.id], a.googleRating, a.googleReviewCount),
  );

  const locale = await getLocale();
  const d = getDict(locale);
  const svc = locale === "ru" ? serviceNameRu(page.service.name) : page.service.name;
  const cityLoc = locative(page.city.name);
  const title = locale === "ru" ? `${svc} — ${page.city.name}` : `${cityLoc} ${svc}`;

  const intro =
    locale === "ru"
      ? `В каталоге rentgen.az — ${page.count} центров города ${page.city.name}, где выполняется исследование «${svc}». Для каждого указаны адрес, режим работы и контакты.`
      : `Rentgen.az kataloqunda ${cityLoc} «${page.service.name}» müayinəsini aparan ${page.count} mərkəz var. Hər biri üçün ünvan, iş qrafiki və əlaqə nömrəsi göstərilib.`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: locale === "ru" ? "Главная" : "Ana səhifə", path: "/" },
            { name: locale === "ru" ? "Рентген-центры" : "Rentgen mərkəzləri", path: "/rentgen-merkezleri" },
            { name: page.city.name, path: `/rentgen-merkezleri/sheher/${page.city.slug}` },
            { name: svc, path: `/rentgen-merkezleri/sheher/${page.city.slug}/${page.service.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            url: `${SITE_URL}/rentgen-merkezleri/sheher/${page.city.slug}/${page.service.slug}`,
            about: {
              "@type": "MedicalTest",
              name: svc,
            },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: sorted.length,
              itemListElement: sorted.slice(0, 30).map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE_URL}/rentgen-merkezleri/${c.slug}`,
                name: c.name,
              })),
            },
          },
        ]}
      />

      <PageHeader
        eyebrow={
          locale === "ru" ? categoryRu(page.service.category) : (page.service.category ?? undefined)
        }
        title={title}
        description={intro}
        breadcrumbs={[
          { name: d.centers.title, href: "/rentgen-merkezleri" },
          { name: page.city.name, href: `/rentgen-merkezleri/sheher/${page.city.slug}` },
          { name: svc },
        ]}
      />

      <Section className="pt-8 pb-12">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-ink-900">{sorted.length}</span> {d.centers.found}
              <span className="text-slate-400"> · {page.city.name} · {svc}</span>
            </p>
            <Link
              href={`/xidmetler/${page.service.slug}`}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {locale === "ru" ? "Об исследовании" : "Müayinə haqqında"} →
            </Link>
          </div>

          {sorted.length > 0 ? (
            <CentersExplorer
              centers={sorted}
              ratings={ratings}
              activeService={page.service.slug}
              sort={parseSort("rating")}
              locale={locale}
            />
          ) : (
            <Card className="p-12 text-center">
              <p className="text-sm text-slate-600">{d.centers.noResultsDesc}</p>
            </Card>
          )}

          {/* Eyni şəhərdə digər müayinələr — daxili keçidlər */}
          {siblings.length > 1 && (
            <div className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="font-display flex items-center gap-2 text-lg font-bold text-ink-900">
                <MapPin className="h-5 w-5 text-brand-600" />
                {locale === "ru"
                  ? `Другие исследования — ${page.city.name}`
                  : `${cityLoc} digər müayinələr`}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {siblings
                  .filter((s) => s.service.slug !== page.service.slug)
                  .map((s) => (
                    <Link
                      key={s.service.slug}
                      href={`/rentgen-merkezleri/sheher/${s.city.slug}/${s.service.slug}`}
                      className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {locale === "ru" ? serviceNameRu(s.service.name) : (s.service.shortName ?? s.service.name)}{" "}
                      <span className="text-slate-400">· {s.count}</span>
                    </Link>
                  ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">
                {stats.count} {locale === "ru" ? `центров в городе ${page.city.name}` : `mərkəz — ${page.city.name}`} ·{" "}
                <Link
                  href={`/rentgen-merkezleri/sheher/${page.city.slug}`}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  {locale === "ru" ? "все центры города" : "şəhərin bütün mərkəzləri"}
                </Link>
              </p>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
