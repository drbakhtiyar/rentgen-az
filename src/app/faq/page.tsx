import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { FaqSections } from "@/components/faq-sections";
import { JsonLd } from "@/components/ui/json-ld";
import { getFaqSections, getAllFaq } from "@/content/faq";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tez-tez verilən suallar — rentgen, KT, MRT, USM",
  description:
    "Rentgen.az platforması, rentgen, KT, MRT, USM, mammoqrafiya, densitometriya və dental görüntüləmə haqqında tez-tez verilən suallar: hazırlıq, təhlükəsizlik, qiymət və qeydiyyat.",
  path: "/faq",
  keywords: [
    "rentgen sualları",
    "MRT zərərlidirmi",
    "KT ilə MRT fərqi",
    "USM hazırlıq",
    "mammoqrafiya neçə yaşdan",
    "densitometriya nədir",
    "dental rentgen",
    "OTP giriş",
  ],
});

export default async function FaqPage() {
  const locale = await getLocale();
  const t = getDict(locale).faqPage;
  const sections = getFaqSections(locale);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Ana səhifə", path: "/" },
            { name: t.title, path: "/faq" },
          ]),
          faqJsonLd(getAllFaq(locale)),
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
          <FaqSections
            sections={sections}
            countSuffix={locale === "ru" ? "вопросов" : "sual"}
          />
        </Container>
      </Section>
    </>
  );
}
