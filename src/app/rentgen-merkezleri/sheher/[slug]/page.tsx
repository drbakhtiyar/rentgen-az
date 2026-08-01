import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { CentersExplorer } from "@/components/map/centers-explorer";
import { getApprovedCenters, getRatingsForCenters } from "@/lib/queries";
import { getCityPages, getCityBySlug, getCityStats, cityIntro } from "@/lib/city-pages";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { parseSort, combinedRatingScore } from "@/lib/rating";

export const revalidate = 300;

/** Yalnız MIN_CENTERS-dən çox mərkəzi olan şəhərlər üçün səhifə var. */
export async function generateStaticParams() {
  const cities = await getCityPages();
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return buildMetadata({ title: "Şəhər tapılmadı", noIndex: true });

  const s = await getCityStats(city.name);
  const top = s.topServices.slice(0, 3).map((t) => t.name).join(", ");
  return buildMetadata({
    title: `${city.name} şəhərində rentgen mərkəzləri`,
    description:
      `${city.name} şəhərində ${city.count} təsdiqlənmiş rentgen və diaqnostika mərkəzi. ` +
      (top ? `${top} və digər müayinələr. ` : "") +
      `Ünvan, iş saatı, əlaqə və qiymətlər rentgen.az-da.`,
    path: `/rentgen-merkezleri/sheher/${city.slug}`,
    keywords: [
      `${city.name} rentgen`,
      `${city.name} rentgen mərkəzi`,
      `${city.name} diaqnostika mərkəzi`,
      `${city.name}da MRT`,
      "rentgen mərkəzləri",
    ],
  });
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const [stats, allCities] = await Promise.all([getCityStats(city.name), getCityPages()]);

  // Şəhərin bütün mərkəzləri (sayı azdır — səhifələmə lazım deyil), reytinqə görə.
  const centers = await getApprovedCenters({ city: city.name, take: 200 });
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));
  const sorted = [...centers].sort(
    (a, b) =>
      combinedRatingScore(ratings[b.id], b.googleRating, b.googleReviewCount) -
      combinedRatingScore(ratings[a.id], a.googleRating, a.googleReviewCount),
  );

  const locale = await getLocale();
  const d = getDict(locale);
  const intro = cityIntro(city.name, stats, locale);
  const others = allCities.filter((c) => c.slug !== city.slug).slice(0, 14);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Ana səhifə", path: "/" },
            { name: "Rentgen mərkəzləri", path: "/rentgen-merkezleri" },
            { name: city.name, path: `/rentgen-merkezleri/sheher/${city.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${city.name} şəhərində rentgen mərkəzləri`,
            url: `${SITE_URL}/rentgen-merkezleri/sheher/${city.slug}`,
            about: { "@type": "City", name: city.name, address: { "@type": "PostalAddress", addressLocality: city.name, addressCountry: "AZ" } },
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
        eyebrow={d.centers.eyebrow}
        title={`${city.name} şəhərində rentgen mərkəzləri`}
        description={intro[0]}
        breadcrumbs={[
          { name: d.centers.title, href: "/rentgen-merkezleri" },
          { name: city.name },
        ]}
      />

      <Section className="pt-8 pb-12">
        <Container>
          {intro.length > 1 && (
            <Card className="mb-8 p-6">
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                {intro.slice(1).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {stats.topServices.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-500">
                    {locale === "ru" ? "Популярные исследования" : "Ən çox təklif olunan müayinələr"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stats.topServices.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/xidmetler/${t.slug}`}
                        className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {t.name} <span className="text-slate-400">· {t.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-ink-900">{sorted.length}</span> {d.centers.found}
              <span className="text-slate-400"> · {city.name}</span>
            </p>
          </div>

          {sorted.length > 0 ? (
            <CentersExplorer
              centers={sorted}
              ratings={ratings}
              sort={parseSort("rating")}
              locale={locale}
            />
          ) : (
            <Card className="p-12 text-center">
              <p className="text-sm text-slate-600">{d.centers.noResultsDesc}</p>
              <ButtonLink href="/rentgen-merkezleri" className="mt-6">
                {d.centers.allCenters}
              </ButtonLink>
            </Card>
          )}

          {/* Digər şəhərlər — daxili keçidlər (crawl üçün) */}
          {others.length > 0 && (
            <div className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="font-display flex items-center gap-2 text-lg font-bold text-ink-900">
                <MapPin className="h-5 w-5 text-brand-600" />
                {locale === "ru" ? "Центры в других городах" : "Digər şəhərlərdə mərkəzlər"}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {others.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/rentgen-merkezleri/sheher/${c.slug}`}
                    className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {c.name} <span className="text-slate-400">· {c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
