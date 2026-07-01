import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { SearchPanel } from "@/components/search-panel";
import { CentersExplorer } from "@/components/map/centers-explorer";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { SERVICES, CITIES, getService } from "@/lib/constants";
import { getApprovedCenters, getRatingsForCenters } from "@/lib/queries";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 120;

const serviceOptions = SERVICES.map((s) => ({ value: s.slug, label: s.name }));
const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; service?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const svc = sp.service ? getService(sp.service) : null;
  const titleParts = ["Rentgen mərkəzləri"];
  if (svc) titleParts.unshift(svc.name);
  if (sp.city) titleParts.push(sp.city);
  return buildMetadata({
    title: `${titleParts.join(" — ")}${sp.city ? "" : " | Bakı"}`,
    description:
      "Bakı və Azərbaycanda təsdiqlənmiş dental rentgen və 3D tomoqrafiya mərkəzləri. Xidmət və rayona görə axtarın, birbaşa əlaqə saxlayın.",
    path: "/rentgen-merkezleri",
    keywords: [
      "rentgen mərkəzi Bakı",
      "dental rentgen",
      "3D tomoqrafiya",
      "yaxın rentgen mərkəzi",
    ],
  });
}

export default async function CentersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; service?: string }>;
}) {
  const sp = await searchParams;
  const centers = await getApprovedCenters({
    q: sp.q,
    city: sp.city,
    service: sp.service,
  });
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));

  const svc = sp.service ? getService(sp.service) : null;
  const activeFilters = [
    svc?.name,
    sp.city,
    sp.q ? `“${sp.q}”` : null,
  ].filter(Boolean);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Rentgen mərkəzləri", path: "/rentgen-merkezleri" },
        ])}
      />
      <PageHeader
        eyebrow="Mərkəzlər kataloqu"
        title="Rentgen mərkəzləri"
        description="Təsdiqlənmiş dental rentgen və 3D tomoqrafiya mərkəzlərini xidmət və rayona görə tapın."
        breadcrumbs={[{ name: "Rentgen mərkəzləri" }]}
      />

      <div className="border-b border-slate-200 bg-white">
        <Container className="py-6">
          <SearchPanel
            services={serviceOptions}
            cities={cityOptions}
            defaults={{ q: sp.q, city: sp.city, service: sp.service }}
            variant="compact"
          />
        </Container>
      </div>

      <Section className="py-12">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-ink-900">{centers.length}</span>{" "}
              mərkəz tapıldı
              {activeFilters.length > 0 && (
                <span className="text-slate-400"> · {activeFilters.join(", ")}</span>
              )}
            </p>
          </div>

          {centers.length > 0 ? (
            <CentersExplorer centers={centers} ratings={ratings} />
          ) : (
            <Card className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="font-display mt-4 text-xl font-bold text-ink-900">
                Nəticə tapılmadı
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Seçilmiş filtrə uyğun təsdiqlənmiş mərkəz yoxdur. Filtri dəyişin və
                ya bütün mərkəzlərə baxın.
              </p>
              <ButtonLink href="/rentgen-merkezleri" className="mt-6">
                Bütün mərkəzlər
              </ButtonLink>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
