import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/ui/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getTerms } from "@/content/legal";

export const metadata = buildMetadata({
  title: "İstifadə şərtləri",
  description:
    "Rentgen.az platformasının istifadə şərtləri: platformanın təyinatı, hesab və OTP giriş, istifadəçi öhdəlikləri, məsuliyyətin məhdudlaşdırılması və tibbi məsuliyyət açıqlaması.",
  path: "/istifade-shertleri",
  keywords: ["istifadə şərtləri", "Rentgen.az qaydaları", "platforma şərtləri"],
});

export default async function TermsOfUsePage() {
  const doc = getTerms(await getLocale());
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: doc.title, path: "/istifade-shertleri" },
        ])}
      />
      <PageHeader
        eyebrow={doc.eyebrow}
        title={doc.title}
        description={doc.description}
        breadcrumbs={[{ name: "Ana səhifə", href: "/" }, { name: doc.title }]}
      />
      <Section>
        <Container>
          <div className="max-w-3xl">
            <p className="text-slate-600 leading-relaxed">{doc.intro}</p>

            {doc.sections.map((s) => (
              <div key={s.h}>
                <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
                  {s.h}
                </h2>
                <p className="text-slate-600 leading-relaxed">{s.b}</p>
              </div>
            ))}

            <h2 className="font-display text-xl font-bold text-ink-900 mt-8 mb-3">
              {doc.contactHeading}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {doc.contactPre}
              <a
                href={`mailto:${doc.email}`}
                className="font-medium text-brand-600 hover:underline"
              >
                {doc.email}
              </a>
              {doc.contactPost}
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
