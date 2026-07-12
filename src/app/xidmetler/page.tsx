import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/ui/json-ld";
import { SymptomSuggest } from "@/components/symptom-suggest";
import { ServicesExplorer } from "@/components/services-explorer";
import { countApprovedCentersByService, getActiveServices } from "@/lib/queries";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Rentgen xidmətləri — bütün rentgen və tomoqrafiya növləri",
  description:
    "Bakıda bütün rentgen növləri: kəllə, ağciyər, onurğa, əl-ayaq, dental rentgen, KT (kompüter tomoqrafiya), MRT, mammoqrafiya, densitometriya, floroskopiya və USM. Qiymətləri müqayisə et, mərkəz tap.",
  path: "/xidmetler",
  keywords: [
    "rentgen növləri",
    "rentgen Bakı",
    "kompüter tomoqrafiya",
    "MRT Bakı",
    "mammoqrafiya",
    "dental rentgen",
    "ağciyər rentgeni",
    "onurğa rentgeni",
  ],
});

export default async function ServicesPage() {
  const [counts, services] = await Promise.all([
    countApprovedCentersByService(),
    getActiveServices(),
  ]);
  const locale = await getLocale();
  const d = getDict(locale).services;

  // Show every service for SEO reach. Services offered by at least one approved
  // center come first (most-offered first); services no center offers yet still
  // appear (each has its own landing page) but after the offered ones. The sort
  // is stable, so within each group the catalog order (category grouping) holds.
  const explorerServices = services
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      description: s.description,
      icon: s.icon,
      iconUrl: s.iconUrl,
      category: s.category,
      count: counts[s.slug] ?? 0,
    }))
    .sort((a, b) => {
      const ha = a.count > 0 ? 1 : 0;
      const hb = b.count > 0 ? 1 : 0;
      if (ha !== hb) return hb - ha;
      return b.count - a.count;
    });

  // Category chips follow the catalog order (Dental → body regions → modalities).
  const categories = Array.from(
    new Set(services.map((s) => s.category).filter((c): c is string => Boolean(c))),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Xidmətlər", path: "/xidmetler" },
        ])}
      />
      <PageHeader
        eyebrow={d.eyebrow}
        title={d.title}
        description={d.description}
        breadcrumbs={[{ name: d.title }]}
      />

      <Section className="pt-10 pb-16 sm:pt-10 lg:pt-10">
        <Container>
          <SymptomSuggest ru={locale === "ru"} />
          <div className="mt-10">
            <ServicesExplorer
              services={explorerServices}
              categories={categories}
              labels={{
                all: locale === "ru" ? "Все" : "Hamısı",
                centerWord: d.centerWord,
                more: d.more,
              }}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
