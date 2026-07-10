import type { Metadata } from "next";
import { Stethoscope, Send, ShieldCheck, Clock, Users } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { ReferralForm } from "@/components/forms/referral-form";
import { DoctorReferralForm } from "@/components/forms/doctor-referral-form";
import { getApprovedCenters } from "@/lib/queries";
import { parseHours, type WeeklyHours } from "@/lib/hours";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { doctorName } from "@/lib/utils";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 120;

export const metadata: Metadata = buildMetadata({
  title: "Həkimlər üçün — pasiyent göndərişi",
  description:
    "Diş həkimləri pasiyentlərini dental rentgen və CBCT müayinəsi üçün platformadakı təsdiqlənmiş mərkəzlərə yönləndirə bilər.",
  path: "/hekimler-ucun",
  keywords: ["diş həkimi üçün rentgen", "pasiyent göndərişi", "CBCT", "dental tomoqrafiya"],
});

export default async function DoctorsPage() {
  const locale = await getLocale();
  const fd = getDict(locale).forDoctors;
  const centers = await getApprovedCenters({ take: 100 });
  const centerOptions = centers.map((c) => ({
    value: c.id,
    label: `${c.name}${c.city ? ` — ${c.city}` : ""}`,
  }));

  // If a doctor is logged in, prepare their partner centers + services for the
  // smart referral form.
  const me = await getCurrentUser();
  let doctorCtx: {
    name: string;
    clinic: string | null;
    centers: { id: string; name: string; city: string | null }[];
    servicesByCenter: Record<string, { slug: string; name: string }[]>;
    hoursByCenter: Record<string, WeeklyHours | null>;
  } | null = null;
  if (me?.role === "DOCTOR" && me.doctorProfile?.status === "APPROVED") {
    const partners = await prisma.centerDoctor.findMany({
      where: { doctorId: me.doctorProfile.id, status: "ACCEPTED" },
      select: {
        center: {
          select: {
            id: true,
            name: true,
            city: true,
            hours: true,
            services: { include: { service: { select: { slug: true, name: true } } } },
          },
        },
      },
      orderBy: { center: { name: "asc" } },
    });
    const servicesByCenter: Record<string, { slug: string; name: string }[]> = {};
    const hoursByCenter: Record<string, WeeklyHours | null> = {};
    for (const p of partners) {
      servicesByCenter[p.center.id] = p.center.services.map((cs) => ({
        slug: cs.service.slug,
        name: cs.service.name,
      }));
      hoursByCenter[p.center.id] = parseHours(p.center.hours);
    }
    doctorCtx = {
      name: doctorName(me.doctorProfile.firstName, me.doctorProfile.lastName),
      clinic: me.doctorProfile.clinic,
      centers: partners.map((p) => ({ id: p.center.id, name: p.center.name, city: p.center.city })),
      servicesByCenter,
      hoursByCenter,
    };
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Həkimlər üçün", path: "/hekimler-ucun" },
        ])}
      />
      <PageHeader
        eyebrow={fd.eyebrow}
        title={fd.title}
        description={fd.description}
        breadcrumbs={[{ name: fd.eyebrow }]}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/giris?role=doctor" variant="primary">
            {fd.registerCta}
          </ButtonLink>
          <ButtonLink
            href="/giris?role=doctor"
            variant="outline"
            className="border-white/30 bg-white/5 text-white hover:bg-white/10"
          >
            {fd.loginCta}
          </ButtonLink>
        </div>
      </PageHeader>

      <Section className="py-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <div className="space-y-4">
              {[
                { icon: <ShieldCheck />, t: fd.f1t, d: fd.f1d },
                { icon: <Clock />, t: fd.f2t, d: fd.f2d },
                { icon: <Users />, t: fd.f3t, d: fd.f3d },
              ].map((f, i) => (
                <Card key={i} className="flex items-start gap-3 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 [&>svg]:h-5 [&>svg]:w-5">
                    {f.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink-900">{f.t}</h3>
                    <p className="text-sm text-slate-600">{f.d}</p>
                  </div>
                </Card>
              ))}
              <Card className="bg-brand-50 p-5">
                <Stethoscope className="h-6 w-6 text-brand-600" />
                <p className="mt-2 text-sm text-brand-900">{fd.note}</p>
              </Card>
            </div>

            <Card className="p-6 sm:p-8">
              <h2 className="font-display flex items-center gap-2 text-2xl font-bold text-ink-900">
                <Send className="h-6 w-6 text-brand-600" /> {fd.formTitle}
              </h2>
              {doctorCtx ? (
                doctorCtx.centers.length > 0 ? (
                  <>
                    <p className="mt-1.5 text-sm text-slate-500">{fd.partnerHint}</p>
                    <div className="mt-6">
                      <DoctorReferralForm
                        doctorName={doctorCtx.name}
                        clinic={doctorCtx.clinic}
                        centers={doctorCtx.centers}
                        servicesByCenter={doctorCtx.servicesByCenter}
                        hoursByCenter={doctorCtx.hoursByCenter}
                        locale={locale}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                    {fd.noPartner}
                    <div className="mt-3">
                      <ButtonLink href="/hekim/merkezler" size="sm">
                        {fd.partnerCentersCta}
                      </ButtonLink>
                    </div>
                  </div>
                )
              ) : (
                <>
                  <p className="mt-1.5 text-sm text-slate-500">{fd.fillRequired}</p>
                  <div className="mt-6">
                    <ReferralForm centers={centerOptions} />
                  </div>
                </>
              )}
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
