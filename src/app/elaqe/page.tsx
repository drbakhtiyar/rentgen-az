import { Mail, MapPin, Clock } from "lucide-react";
import { WhatsAppOutline } from "@/components/ui/whatsapp-icon";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { PageHeroVisual, PAGE_HERO } from "@/components/services-hero-visual";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/ui/json-ld";
import { ContactForm } from "@/components/forms/contact-form";
import { PLATFORM_WHATSAPP_DISPLAY, PLATFORM_WHATSAPP_URL } from "@/lib/constants";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Əlaqə — Rentgen.az ilə əlaqə saxlayın",
  description:
    "Rentgen.az komandası ilə telefon, e-poçt və ya WhatsApp vasitəsilə əlaqə saxlayın. Suallarınızı yazın və ya ümumi sorğu göndərin.",
  path: "/elaqe",
  keywords: ["Rentgen.az əlaqə", "dental rentgen əlaqə", "WhatsApp", "Bakı"],
});

export default async function ContactPage() {
  const locale = await getLocale();
  const c = getDict(locale).contact;
  const contactItems = [
    { icon: Mail, title: c.email, value: "info@rentgen.az", href: "mailto:info@rentgen.az" },
    { icon: MapPin, title: c.address, value: c.addressValue },
    { icon: Clock, title: c.hours, value: c.hoursValue },
    // WhatsApp da adi əlaqə blokudur (2026-08-16): ayrıca düymə yoxdur —
    // nömrənin özünə toxunanda WhatsApp açılır.
    {
      icon: WhatsAppOutline,
      title: "WhatsApp",
      value: PLATFORM_WHATSAPP_DISPLAY,
      href: PLATFORM_WHATSAPP_URL,
      external: true,
    },
  ];
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Əlaqə", path: "/elaqe" },
        ])}
      />
      <PageHeader
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.description}
        breadcrumbs={[
          { name: "Ana səhifə", href: "/" },
          { name: c.title },
        ]}
        visual={<PageHeroVisual src={PAGE_HERO.contact} alt={c.title} />}
      />
      <Section>
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-ink-900">
                {c.infoTitle}
              </h2>
              {/* 2-up compact grid on phones — the stacked full-width cards made
                  the page very long to scroll. */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                      <span
                        className="icon-wiggle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-100 sm:h-10 sm:w-10"
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-500 sm:text-sm">
                          {item.title}
                        </div>
                        <div className="break-words text-sm font-medium text-ink-900 sm:text-base">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <Card key={item.title} className="group p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_rgba(64,60,213,0.35)] sm:p-5">
                      {item.href ? (
                        <a
                          href={item.href}
                          className="block hover:opacity-80"
                          {...(item.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 2026-08-22: analizler.az naxışı — OTP-təsdiqli «Sorğu göndərin»
                forması (spam qorunması: yalnız kod təsdiqindən sonra yazılır) */}
            <Card className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-ink-900">
                {locale === "ru" ? "Отправить запрос" : "Sorğu göndərin"}
              </h2>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                {locale === "ru"
                  ? "Заполните форму — мы примем ваш запрос и свяжемся с вами."
                  : "Aşağıdakı formanı doldurun — sorğunuzu qəbul edib sizinlə əlaqə saxlayacağıq."}
              </p>
              <ContactForm ru={locale === "ru"} />

              {/* Axiora imzası (2026-08-22, istifadəçi istəyi): çətir şirkətə
                  yönləndirən diskret düymə */}
              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                <a
                  href="https://axiora.az"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-iris-veil hover:text-iris-pulse hover:shadow-[0_10px_28px_-12px_rgba(64,60,213,0.4)]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-iris-pulse to-iris-glow text-[10px] font-bold text-white">
                    A
                  </span>
                  {locale === "ru" ? "Проект компании Axiora" : "Axiora şirkətinin layihəsi"}
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </a>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
