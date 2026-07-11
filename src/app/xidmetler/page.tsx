import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceIcon } from "@/components/ui/service-icon";
import { JsonLd } from "@/components/ui/json-ld";
import { SymptomSuggest } from "@/components/symptom-suggest";
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

  // Only show services that at least one approved center offers.
  const visible = services.filter((s) => (counts[s.slug] ?? 0) > 0);

  const categories = Array.from(
    new Set(visible.map((s) => s.category).filter((c): c is string => Boolean(c))),
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

      <Section className="py-8">
        <Container>
          <SymptomSuggest ru={locale === "ru"} />
        </Container>
      </Section>

      {categories.map((cat) => (
        <Section key={cat} className="py-12 odd:bg-surface">
          <Container>
            <SectionHeading align="left" eyebrow={cat ?? undefined} title={`${cat} ${d.categorySuffix}`} />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.filter((s) => s.category === cat).map((s) => (
                <Link key={s.slug} href={`/xidmetler/${s.slug}`}>
                  <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-glow)]">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <ServiceIcon name={s.icon} url={s.iconUrl} className="h-6 w-6" />
                      </div>
                      {counts[s.slug] ? (
                        <Badge tone="cyan">{counts[s.slug]} {d.centerWord}</Badge>
                      ) : null}
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-ink-900">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {s.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                      {d.more} <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ))}
    </>
  );
}
