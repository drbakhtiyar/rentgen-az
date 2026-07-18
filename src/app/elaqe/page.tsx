import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { getApprovedDoctors, getActiveServices } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth/rbac";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { doctorName } from "@/lib/utils";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Əlaqə — Rentgen.az ilə əlaqə saxlayın",
  description:
    "Rentgen.az komandası ilə telefon, e-poçt və ya WhatsApp vasitəsilə əlaqə saxlayın. Suallarınızı yazın və ya ümumi sorğu göndərin.",
  path: "/elaqe",
  keywords: ["Rentgen.az əlaqə", "dental rentgen əlaqə", "WhatsApp", "Bakı"],
});

export default async function ContactPage() {
  const doctors = await getApprovedDoctors();
  const serviceOptions = (await getActiveServices()).map((s) => ({
    value: s.slug,
    label: s.name,
  }));
  const locale = await getLocale();
  const c = getDict(locale).contact;
  const contactItems = [
    { icon: Phone, title: c.phone, value: "+994 50 000 00 00", href: "tel:+994500000000" },
    { icon: Mail, title: c.email, value: "info@rentgen.az", href: "mailto:info@rentgen.az" },
    { icon: MapPin, title: c.address, value: c.addressValue },
    { icon: Clock, title: c.hours, value: c.hoursValue },
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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 sm:h-10 sm:w-10">
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
                        <a href={item.href} className="block hover:opacity-80">
                          {content}
                        </a>
                      ) : (
                        content
                      )}
                    </Card>
                  );
                })}
              </div>
              <Card className="p-3 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 sm:h-10 sm:w-10">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-500 sm:text-sm">
                        WhatsApp
                      </div>
                      <div className="text-sm font-medium text-ink-900 sm:text-base">
                        {c.whatsappDesc}
                      </div>
                    </div>
                    <ButtonLink
                      href="https://wa.me/994500000000"
                      variant="whatsapp"
                      size="sm"
                    >
                      {c.whatsappCta}
                    </ButtonLink>
                  </div>
                </div>
              </Card>
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
                doctors={doctors.map((d) => ({
                  value: d.id,
                  label: `${doctorName(d.firstName, d.lastName)}${
                    d.clinic ? " — " + d.clinic : ""
                  }`,
                }))}
              />
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
