import type { Metadata } from "next";
import { Stethoscope, Send, ShieldCheck, Clock, Users } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { ReferralForm } from "@/components/forms/referral-form";
import { getApprovedCenters } from "@/lib/queries";
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
  const centers = await getApprovedCenters({ take: 100 });
  const centerOptions = centers.map((c) => ({
    value: c.id,
    label: `${c.name}${c.city ? ` — ${c.city}` : ""}`,
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Həkimlər üçün", path: "/hekimler-ucun" },
        ])}
      />
      <PageHeader
        eyebrow="Həkimlər üçün"
        title="Pasiyentinizi etibarlı mərkəzə yönləndirin"
        description="Pasiyentinizi dental rentgen və CBCT müayinəsi üçün platformadakı təsdiqlənmiş mərkəzlərə yönləndirə bilərsiniz. Həkim kimi qeydiyyatdan keçsəniz, pasiyentlərinizin hansı mərkəzdə hansı müayinədən yararlandığını da izləyə bilərsiniz."
        breadcrumbs={[{ name: "Həkimlər üçün" }]}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/giris?role=doctor" variant="primary">
            Həkim kimi qeydiyyat
          </ButtonLink>
          <ButtonLink
            href="/giris?role=doctor"
            variant="outline"
            className="border-white/30 bg-white/5 text-white hover:bg-white/10"
          >
            Həkim girişi
          </ButtonLink>
        </div>
      </PageHeader>

      <Section className="py-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <div className="space-y-4">
              {[
                { icon: <ShieldCheck />, t: "Təsdiqlənmiş mərkəzlər", d: "Yalnız yoxlanılmış mərkəzlər platformada görünür." },
                { icon: <Clock />, t: "Sürətli göndəriş", d: "Bir dəqiqədən az müddətdə göndəriş yaradın." },
                { icon: <Users />, t: "Pasiyent rahatlığı", d: "Pasiyent yaxın və uyğun mərkəzə yönləndirilir." },
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
                <p className="mt-2 text-sm text-brand-900">
                  Qeyd: Bu forma vasitəsilə paylaşılan pasiyent məlumatları yalnız
                  seçilmiş mərkəzə müayinənin təşkili məqsədilə ötürülür.
                </p>
              </Card>
            </div>

            <Card className="p-6 sm:p-8">
              <h2 className="font-display flex items-center gap-2 text-2xl font-bold text-ink-900">
                <Send className="h-6 w-6 text-brand-600" /> Pasiyent göndərişi forması
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Bütün məcburi sahələri doldurun.
              </p>
              <div className="mt-6">
                <ReferralForm centers={centerOptions} />
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
