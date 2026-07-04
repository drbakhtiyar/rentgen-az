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
import { VerifiedBadge, Badge } from "@/components/ui/badge";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { Stars, RatingSummary } from "@/components/reviews/stars";
import { ReviewForm } from "@/components/reviews/review-form";
import { JsonLd } from "@/components/ui/json-ld";
import {
  getCenterBySlug,
  getApprovedDoctors,
  getCenterReviews,
  getRatingsForCenters,
} from "@/lib/queries";
import { CenterMiniMap } from "@/components/map/center-mini-map";
import { OpenStatus } from "@/components/centers/open-status";
import { parseHours, hoursRows, nowInBaku } from "@/lib/hours";
import { getCurrentUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { formatPrice, formatDateAz, cn } from "@/lib/utils";
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

  const doctors = await getApprovedDoctors();
  const svcNames = center.services.map((s) => s.service.name);
  const week = parseHours(center.hours);
  const todayKey = nowInBaku().day;

  const [reviews, ratingsMap] = await Promise.all([
    getCenterReviews(center.id),
    getRatingsForCenters([center.id]),
  ]);
  const rating = ratingsMap[center.id] ?? { avg: 0, count: 0 };

  const me = await getCurrentUser();
  let canReview = false;
  let existingReview: { rating: number; comment: string | null } | null = null;
  const isPatient = me?.role === "PATIENT" && !!me.patientProfile;
  if (isPatient && me?.patientProfile) {
    try {
      const completed = await prisma.appointmentRequest.findFirst({
        where: {
          patientId: me.patientProfile.id,
          centerId: center.id,
          status: "COMPLETED",
        },
      });
      canReview = !!completed;
      existingReview = await prisma.review.findUnique({
        where: {
          centerId_patientId: {
            centerId: center.id,
            patientId: me.patientProfile.id,
          },
        },
        select: { rating: true, comment: true },
      });
    } catch {
      canReview = false;
      existingReview = null;
    }
  }

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
          {center.logoUrl && (
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/20 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={center.logoUrl}
                alt={`${center.name} loqosu`}
                className="h-full w-full object-contain"
              />
            </span>
          )}
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
          {center.hours ? <OpenStatus hours={center.hours} /> : null}
          <RatingSummary
            avg={rating.avg}
            count={rating.count}
            className="[&_.text-ink-900]:text-white [&_.text-slate-400]:text-slate-300"
          />
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
                  {!week && center.workingHours && (
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
                {center.lat != null && center.lng != null && (
                  <div className="mt-4">
                    <CenterMiniMap
                      lat={center.lat}
                      lng={center.lng}
                      name={center.name}
                      slug={center.slug}
                    />
                  </div>
                )}
              </Card>

              {/* Working hours */}
              {week && (
                <Card className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display flex items-center gap-2 text-xl font-bold text-ink-900">
                      <Clock className="h-5 w-5 text-brand-600" /> İş saatları
                    </h2>
                    {center.hours ? <OpenStatus hours={center.hours} /> : null}
                  </div>
                  <ul className="mt-4 divide-y divide-slate-100">
                    {hoursRows(week).map((row) => (
                      <li
                        key={row.key}
                        className={cn(
                          "flex items-center justify-between py-2.5 text-sm",
                          row.key === todayKey && "font-semibold text-brand-700",
                        )}
                      >
                        <span className={cn(row.key !== todayKey && "text-slate-600")}>
                          {row.label}
                          {row.key === todayKey && " · bu gün"}
                        </span>
                        <span
                          className={cn(
                            row.text === "Bağlı" ? "text-slate-400" : "text-ink-900",
                            row.key === todayKey && row.text !== "Bağlı" && "text-brand-700",
                          )}
                        >
                          {row.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Reviews */}
              <Card className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-ink-900">
                    Rəylər
                  </h2>
                  <RatingSummary avg={rating.avg} count={rating.count} />
                </div>

                {reviews.length > 0 ? (
                  <ul className="mt-5 space-y-5">
                    {reviews.map((r) => {
                      const displayName =
                        `${r.patient.firstName} ${
                          r.patient.lastName ? r.patient.lastName[0] + "." : ""
                        }`.trim() || "Pasiyent";
                      return (
                        <li
                          key={r.id}
                          className="border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Stars value={r.rating} size="sm" />
                            <span className="text-sm font-semibold text-ink-900">
                              {displayName}
                            </span>
                            {r.verified && (
                              <Badge tone="green">Təsdiqlənmiş müştəri</Badge>
                            )}
                          </div>
                          {r.comment && (
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                              {r.comment}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-slate-400">
                            {formatDateAz(r.createdAt)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Hələ rəy yoxdur. İlk rəyi siz yazın.
                  </p>
                )}

                {canReview ? (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="font-display text-base font-bold text-ink-900">
                      {existingReview ? "Rəyinizi yeniləyin" : "Rəyinizi yazın"}
                    </h3>
                    <div className="mt-3">
                      <ReviewForm
                        centerId={center.id}
                        centerName={center.name}
                        defaultRating={existingReview?.rating}
                        defaultComment={existingReview?.comment ?? undefined}
                      />
                    </div>
                  </div>
                ) : isPatient ? (
                  <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500">
                    Bu mərkəzə yalnız xidmət aldıqdan sonra rəy yaza bilərsiniz.
                  </p>
                ) : null}
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
                    doctors={doctors.map((d) => ({
                      value: d.id,
                      label:
                        `${[d.firstName, d.lastName].filter(Boolean).join(" ")}${
                          d.clinic ? " — " + d.clinic : ""
                        }` || "Həkim",
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
