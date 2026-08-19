import {
  Mail,
  MapPin,
  MessageCircle,
  Clock,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { PageHeroVisual, PAGE_HERO } from "@/components/services-hero-visual";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/ui/json-ld";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { getActiveServices } from "@/lib/queries";
import { PLATFORM_WHATSAPP_DISPLAY, PLATFORM_WHATSAPP_URL } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/rbac";
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
  const serviceOptions = (await getActiveServices()).map((s) => ({
    value: s.slug,
    label: s.name,
  }));
  const locale = await getLocale();
  const c = getDict(locale).contact;
  const contactItems = [
    { icon: Mail, title: c.email, value: "info@rentgen.az", href: "mailto:info@rentgen.az" },
    { icon: MapPin, title: c.address, value: c.addressValue },
    { icon: Clock, title: c.hours, value: c.hoursValue },
    // WhatsApp da adi əlaqə blokudur (2026-08-16): ayrıca düymə yoxdur —
    // nömrənin özünə toxunanda WhatsApp açılır.
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: PLATFORM_WHATSAPP_DISPLAY,
      href: PLATFORM_WHATSAPP_URL,
      external: true,
      tone: "whatsapp" as const,
    },
  ];
  const me = await getCurrentUser();
  const patientInfo =
    me?.role === "PATIENT" && me.patientProfile
      ? {
          name: [me.patientProfile.firstName, me.patientProfile.lastName]
            .filter(Boolean)
            .join(" "),
          phone: me.phone,
        }
      : null;
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
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${
                          item.tone === "whatsapp"
                            ? "bg-green-50 text-green-600"
                            : "bg-brand-50 text-brand-600"
                        }`}
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
                    <Card key={item.title} className="p-3 sm:p-5">
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

            <Card className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-ink-900">
                {c.writeTitle}
              </h2>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                {c.writeDesc}
              </p>
              <AppointmentForm
                locale={locale}
                patient={patientInfo}
                services={serviceOptions}
                withTopic
              />
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
