import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/ui/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getPrivacy } from "@/content/legal";

export const metadata = buildMetadata({
  title: "Gizlilik siyasəti",
  description:
    "Rentgen.az platformasının gizlilik siyasəti: hansı məlumatların toplandığı, telefon nömrəsi və OTP kodların necə işləndiyi, məlumatların qorunması və istifadəçi hüquqları.",
  path: "/gizlilik-siyaseti",
  keywords: ["gizlilik siyasəti", "şəxsi məlumatların qorunması", "Rentgen.az"],
});

export default async function PrivacyPolicyPage() {
  const doc = getPrivacy(await getLocale());
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: doc.title, path: "/gizlilik-siyaseti" },
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
