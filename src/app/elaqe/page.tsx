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
import { doctorName } from "@/lib/utils";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Əlaqə — Rentgen.az ilə əlaqə saxlayın",
  description:
    "Rentgen.az komandası ilə telefon, e-poçt və ya WhatsApp vasitəsilə əlaqə saxlayın. Suallarınızı yazın və ya ümumi sorğu göndərin.",
  path: "/elaqe",
  keywords: ["Rentgen.az əlaqə", "dental rentgen əlaqə", "WhatsApp", "Bakı"],
});

const contactItems = [
  {
    icon: Phone,
    title: "Telefon",
    value: "+994 50 000 00 00",
    href: "tel:+994500000000",
  },
  {
    icon: Mail,
    title: "E-poçt",
    value: "info@rentgen.az",
    href: "mailto:info@rentgen.az",
  },
  {
    icon: MapPin,
    title: "Ünvan",
    value: "Bakı, Azərbaycan",
  },
  {
    icon: Clock,
    title: "İş saatları",
    value: "Hər gün 09:00 – 19:00",
  },
];

export default async function ContactPage() {
  const doctors = await getApprovedDoctors();
  const serviceOptions = (await getActiveServices()).map((s) => ({
    value: s.slug,
    label: s.name,
  }));
  const locale = await getLocale();
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
        eyebrow="Bizimlə əlaqə"
        title="Əlaqə"
        description="Suallarınız var? Bizimlə əlaqə saxlayın və ya aşağıdakı formanı doldurun — komandamız sizə kömək edəcək."
        breadcrumbs={[
          { name: "Ana səhifə", href: "/" },
          { name: "Əlaqə" },
        ]}
      />
      <Section>
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-ink-900">
                Əlaqə məlumatları
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-500">
                          {item.title}
                        </div>
                        <div className="font-medium text-ink-900">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <Card key={item.title} className="p-5">
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
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-500">
                      WhatsApp
                    </div>
                    <div className="mb-3 font-medium text-ink-900">
                      Mesaj yazaraq sürətli cavab alın
                    </div>
                    <ButtonLink
                      href="https://wa.me/994500000000"
                      variant="whatsapp"
                      size="sm"
                    >
                      WhatsApp-da yazın
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-ink-900">
                Bizə yazın
              </h2>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                Aşağıdakı formanı doldurun — sorğunuzu qəbul edib sizinlə əlaqə
                saxlayacağıq.
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
