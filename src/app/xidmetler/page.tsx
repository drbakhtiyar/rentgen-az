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
  title: "Xidmətlər — dental rentgen və tomoqrafiya növləri",
  description:
    "Dental rentgen, panoramik və sefalometrik rentgen, 3D tomoqrafiya, CBCT, implant öncəsi tomoqrafiya və digər görüntüləmə xidmətləri.",
  path: "/xidmetler",
  keywords: [
    "dental rentgen",
    "3D tomoqrafiya",
    "panoramik rentgen",
    "sefalometrik rentgen",
    "CBCT",
  ],
});

export default async function ServicesPage() {
  const [counts, services] = await Promise.all([
    countApprovedCentersByService(),
    getActiveServices(),
  ]);
  const locale = await getLocale();
  const d = getDict(locale).services;

  // Only services offered by at least one approved center, ordered by how many
  // centers offer them (most-offered first).
  const explorerServices = services
    .filter((s) => (counts[s.slug] ?? 0) > 0)
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      description: s.description,
      icon: s.icon,
      iconUrl: s.iconUrl,
      category: s.category,
      count: counts[s.slug] ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const categories = Array.from(
    new Set(explorerServices.map((s) => s.category).filter((c): c is string => Boolean(c))),
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
