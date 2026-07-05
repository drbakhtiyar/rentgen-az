import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { SearchPanel } from "@/components/search-panel";
import { CentersExplorer } from "@/components/map/centers-explorer";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import {
  getApprovedCenters,
  countApprovedCenters,
  getRatingsForCenters,
  getCitiesWithCenters,
  getActiveServices,
  getServiceBySlug,
} from "@/lib/queries";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";

export const revalidate = 120;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; service?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const svc = sp.service ? await getServiceBySlug(sp.service) : null;
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

const PAGE_SIZE = 12;

export default async function CentersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; service?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = { q: sp.q, city: sp.city, service: sp.service };
  const page = Math.max(1, Number(sp.page) || 1);

  const [total, centers] = await Promise.all([
    countApprovedCenters(filters),
    getApprovedCenters({ ...filters, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const ratings = await getRatingsForCenters(centers.map((c) => c.id));
  const cityOptions = (await getCitiesWithCenters()).map((c) => ({
    value: c,
    label: c,
  }));
  const serviceOptions = (await getActiveServices()).map((s) => ({
    value: s.slug,
    label: s.name,
  }));
  const d = getDict(await getLocale());
  const searchLabels = { ...d.search, search: d.cta.search };

  const svc = sp.service ? await getServiceBySlug(sp.service) : null;
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
            labels={searchLabels}
          />
        </Container>
      </div>

      <Section className="py-12">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-ink-900">{total}</span>{" "}
              mərkəz tapıldı
              {totalPages > 1 && (
                <span className="text-slate-400"> · səhifə {page}/{totalPages}</span>
              )}
              {activeFilters.length > 0 && (
                <span className="text-slate-400"> · {activeFilters.join(", ")}</span>
              )}
            </p>
          </div>

          {centers.length > 0 ? (
            <>
              <CentersExplorer
                centers={centers}
                ratings={ratings}
                activeService={sp.service}
              />
              {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const params = new URLSearchParams();
                    if (sp.q) params.set("q", sp.q);
                    if (sp.city) params.set("city", sp.city);
                    if (sp.service) params.set("service", sp.service);
                    if (p > 1) params.set("page", String(p));
                    const href = `/rentgen-merkezleri${params.toString() ? `?${params}` : ""}`;
                    return (
                      <a
                        key={p}
                        href={href}
                        className={
                          p === page
                            ? "inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-brand-600 px-3 text-sm font-semibold text-white"
                            : "inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                        }
                      >
                        {p}
                      </a>
                    );
                  })}
                </nav>
              )}
            </>
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
