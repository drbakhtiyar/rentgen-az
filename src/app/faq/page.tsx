import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/ui/json-ld";
import { getAllFaq } from "@/content/faq";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tez-tez verilən suallar — dental rentgen və 3D tomoqrafiya",
  description:
    "Dental rentgen, panoramik və sefalometrik rentgen, 3D tomoqrafiya (CBCT), implant tomoqrafiyası, qiymət, qeydiyyat və OTP giriş haqqında tez-tez verilən suallar.",
  path: "/faq",
  keywords: [
    "dental rentgen sualları",
    "3D tomoqrafiya nədir",
    "panoramik rentgen",
    "implant tomoqrafiyası",
    "CBCT qiymət",
    "OTP giriş",
  ],
});

export default async function FaqPage() {
  const locale = await getLocale();
  const t = getDict(locale).faqPage;
  const items = getAllFaq(locale);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Ana səhifə", path: "/" },
            { name: t.title, path: "/faq" },
          ]),
          faqJsonLd(items),
        ]}
      />
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        breadcrumbs={[
          { name: "Ana səhifə", href: "/" },
          { name: t.title },
        ]}
      />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <FaqAccordion items={items} />
          </div>
        </Container>
      </Section>
    </>
  );
}
