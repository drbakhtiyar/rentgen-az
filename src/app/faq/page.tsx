import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { PageHeroVisual, PAGE_HERO } from "@/components/services-hero-visual";
import { PLATFORM_WHATSAPP_URL, PLATFORM_WHATSAPP_DISPLAY } from "@/lib/constants";
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
        visual={<PageHeroVisual src={PAGE_HERO.faq} alt={t.title} />}
      />
      <Section>
        <Container>
          <FaqSections
            sections={sections}
            countSuffix={locale === "ru" ? "вопросов" : "sual"}
          />

          {/* «Cavabını tapmadınız?» — analizler.az-dakı blokun rentgen variantı
              (2026-08-16, istifadəçi istəyi). Nömrə platforma WhatsApp-ıdır —
              yazışmanı bot qarşılayır. */}
          <div className="mx-auto mt-14 max-w-5xl rounded-3xl bg-iris-canvas px-6 py-10 text-center ring-1 ring-iris-border">
            <h2 className="font-display text-2xl font-semibold text-white">
              {locale === "ru" ? "Не нашли ответ?" : "Cavabını tapmadınız?"}
            </h2>
            <p className="mt-2 text-sm text-ash-2">
              {locale === "ru"
                ? "Напишите в WhatsApp — ответим в кратчайшие сроки."
                : "WhatsApp-dan yazın — qısa zamanda cavablandırırıq."}
            </p>
            <a
              href={PLATFORM_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="chip-sheen mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
            >
              WhatsApp: {PLATFORM_WHATSAPP_DISPLAY}
            </a>
          </div>
        </Container>
      </Section>
    </>
  );
}
