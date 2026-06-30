import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceIcon } from "@/components/ui/service-icon";
import { JsonLd } from "@/components/ui/json-ld";
import { SERVICES } from "@/lib/constants";
import { countApprovedCentersByService } from "@/lib/queries";
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
  const counts = await countApprovedCentersByService();

  const categories = Array.from(new Set(SERVICES.map((s) => s.category)));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Xidmətlər", path: "/xidmetler" },
        ])}
      />
      <PageHeader
        eyebrow="Görüntüləmə xidmətləri"
        title="Dental rentgen və tomoqrafiya xidmətləri"
        description="Diaqnostika və müalicə planlaması üçün lazım olan bütün görüntüləmə növləri — hər biri üçün təsdiqlənmiş mərkəzləri tapın."
        breadcrumbs={[{ name: "Xidmətlər" }]}
      />

      {categories.map((cat) => (
        <Section key={cat} className="py-12 odd:bg-surface">
          <Container>
            <SectionHeading align="left" eyebrow={cat ?? undefined} title={`${cat} xidmətləri`} />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.filter((s) => s.category === cat).map((s) => (
                <Link key={s.slug} href={`/xidmetler/${s.slug}`}>
                  <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-glow)]">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <ServiceIcon name={s.icon} className="h-6 w-6" />
                      </div>
                      {counts[s.slug] ? (
                        <Badge tone="cyan">{counts[s.slug]} mərkəz</Badge>
                      ) : null}
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-ink-900">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {s.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                      Ətraflı və mərkəzlər <ArrowRight className="h-4 w-4" />
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
