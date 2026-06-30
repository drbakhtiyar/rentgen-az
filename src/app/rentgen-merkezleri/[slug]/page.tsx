import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  Cpu,
  User,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/badge";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { JsonLd } from "@/components/ui/json-ld";
import { getCenterBySlug } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import {
  buildMetadata,
  breadcrumbJsonLd,
  medicalBusinessJsonLd,
} from "@/lib/seo";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const center = await getCenterBySlug(slug);
  if (!center) return buildMetadata({ title: "Mərkəz tapılmadı", noIndex: true });

  const svcNames = center.services.map((s) => s.service.shortName ?? s.service.name);
  return buildMetadata({
    title: `${center.name}${center.city ? ` — ${center.city}` : ""}`,
    description:
      center.description?.slice(0, 155) ||
      `${center.name} — ${svcNames.slice(0, 4).join(", ")} xidmətləri. Ünvan, iş saatları və əlaqə məlumatı.`,
    path: `/rentgen-merkezleri/${center.slug}`,
    keywords: [center.name, ...svcNames, "rentgen mərkəzi", center.city ?? "Bakı"],
  });
}

export default async function CenterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const center = await getCenterBySlug(slug);
  if (!center) notFound();

  const svcNames = center.services.map((s) => s.service.name);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Ana səhifə", path: "/" },
            { name: "Rentgen mərkəzləri", path: "/rentgen-merkezleri" },
            { name: center.name, path: `/rentgen-merkezleri/${center.slug}` },
          ]),
          medicalBusinessJsonLd({
            name: center.name,
            slug: center.slug,
            phone: center.phone,
            address: center.address,
            city: center.city,
            images: center.images,
            lat: center.lat,
            lng: center.lng,
            services: svcNames,
          }),
        ]}
      />

      <PageHeader
        title={center.name}
        breadcrumbs={[
          { name: "Rentgen mərkəzləri", href: "/rentgen-merkezleri" },
          { name: center.name },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <VerifiedBadge />
          {center.city && (
            <span className="flex items-center gap-1.5 text-sm text-slate-300">
              <MapPin className="h-4 w-4 text-cyan-400" /> {center.city}
            </span>
          )}
          {center.workingHours && (
            <span className="flex items-center gap-1.5 text-sm text-slate-300">
              <Clock className="h-4 w-4 text-cyan-400" /> {center.workingHours}
            </span>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <CallButton phone={center.phone} />
          {center.whatsapp && <WhatsAppButton phone={center.whatsapp} />}
        </div>
      </PageHeader>

      <Section className="py-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              {/* Images */}
              {center.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {center.images.slice(0, 6).map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img}
                      alt={`${center.name} — şəkil ${i + 1}`}
                      className="aspect-video w-full rounded-xl object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}

              {center.description && (
                <Card className="p-6">
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Mərkəz haqqında
                  </h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                    {center.description}
                  </p>
                </Card>
              )}

              {/* Services & prices */}
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold text-ink-900">
                  Xidmətlər və qiymətlər
                </h2>
                {center.services.length > 0 ? (
                  <ul className="mt-4 divide-y divide-slate-100">
                    {center.services.map((cs) => (
                      <li
                        key={cs.id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />
                          <div>
                            <Link
                              href={`/xidmetler/${cs.service.slug}`}
                              className="font-medium text-ink-900 hover:text-brand-700"
                            >
                              {cs.service.name}
                            </Link>
                            {cs.note && (
                              <p className="text-xs text-slate-500">{cs.note}</p>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink-800">
                          {formatPrice(cs.price, cs.priceTo)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Xidmət siyahısı tezliklə əlavə olunacaq.
                  </p>
                )}
              </Card>

              {/* Details */}
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold text-ink-900">
                  Əlaqə və məlumat
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Detail icon={<Phone />} label="Telefon" value={center.phone} />
                  {center.address && (
                    <Detail icon={<MapPin />} label="Ünvan" value={center.address} />
                  )}
                  {center.workingHours && (
                    <Detail icon={<Clock />} label="İş saatları" value={center.workingHours} />
                  )}
                  {center.equipment && (
                    <Detail icon={<Cpu />} label="Avadanlıq" value={center.equipment} />
                  )}
                  {center.responsiblePerson && (
                    <Detail icon={<User />} label="Məsul şəxs" value={center.responsiblePerson} />
                  )}
                </dl>
                {center.mapsUrl && (
                  <a
                    href={center.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <MapPin className="h-4 w-4" /> Xəritədə bax
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </Card>
            </div>

            {/* Sidebar — appointment form */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-ink-900">
                  Müraciət göndər
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mərkəz sizinlə əlaqə saxlasın.
                </p>
                <div className="mt-4">
                  <AppointmentForm
                    centerId={center.id}
                    services={center.services.map((cs) => ({
                      value: cs.service.slug,
                      label: cs.service.name,
                    }))}
                    compact
                  />
                </div>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div>
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="text-sm font-medium text-ink-900">{value}</dd>
      </div>
    </div>
  );
}
