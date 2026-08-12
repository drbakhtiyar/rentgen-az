import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MessageCircle,
  ArrowRight,
  Stethoscope,
  Building2,
  Users,
  Radiation,
  ScanLine,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { ServiceIcon } from "@/components/ui/service-icon";
import { SmartSearch } from "@/components/smart-search";
import { HeroVisual } from "@/components/hero-visual";
import { CenterCard } from "@/components/centers/center-card";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/ui/json-ld";
import {
  getActiveServices,
  getFeaturedCenters,
  getPublishedPosts,
  getPlatformStats,
  countApprovedCentersByService,
  getServiceRequestCounts,
  getRatingsForCenters,
  getCoveredCities,
} from "@/lib/queries";
import { faqJsonLd } from "@/lib/seo";
import { getHomeFaq } from "@/content/faq";
import { formatDateAz } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { pickCrossCategoryRandom } from "@/lib/random-services";

export const revalidate = 300;

/* ANA SƏHİFƏ — Impilo üslubu (DESIGN.md layihə kökündə, 2026-08-12 istifadəçi
 * təsdiqi). "Midnight clinical observatory": Deep Iris kanvas, data siyan
 * parlayır, mint = müsbət semantika, pill həndəsə, yalnız Manrope 500/600.
 * Dərinlik ton fərqindən gəlir (kölgəsiz kartlar); yeganə açıq bölmə Pearl
 * inversiyasıdır (imza "hard cut"). Digər səhifələr bu üsluba KEÇMƏYİB. */

export default async function HomePage() {
  const locale = await getLocale();
  const [centers, posts, stats, counts, , allServices, coveredCities] = await Promise.all([
    getFeaturedCenters(6),
    getPublishedPosts(3, locale),
    getPlatformStats(),
    countApprovedCentersByService(),
    getServiceRequestCounts(),
    getActiveServices(),
    getCoveredCities(),
  ]);
  const d = getDict(locale);
  const homeFaq = getHomeFaq(locale);

  const ratings = await getRatingsForCenters(centers.map((c) => c.id));

  // Hər ziyarətdə TƏSADÜFİ 4 xidmət — hər biri FƏRQLİ kateqoriyadan
  // (istifadəçi qərarı). Ortaq məntiq: src/lib/random-services.ts.
  const offeredServices = allServices.filter((s) => (counts[s.slug] ?? 0) > 0);
  const featuredServices = pickCrossCategoryRandom(offeredServices, 4);
  const marqueeServices = offeredServices.slice(0, 14);

  return (
    <>
      <JsonLd data={faqJsonLd(homeFaq.map((f) => ({ question: f.question, answer: f.answer })))} />

      {/* ============ HERO — asimmetrik split, Deep Iris kanvas ============ */}
      <section className="relative overflow-hidden bg-observatory text-white">
        <Container className="relative pt-16 pb-14 lg:pt-24 lg:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="font-display animate-fade-up text-4xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-5xl lg:text-[4.25rem]">
                {d.hero.titleA}
                {/* Impilo imza elementi: Word Highlight Box — səhifədə BİR dəfə */}
                <span className="inline-block rounded-[7px] border border-dashed border-clinical px-2 leading-[1.15] text-clinical sm:px-3">
                  {d.hero.titleHighlight}
                </span>
                {d.hero.titleB}
              </h1>
              <p className="animate-fade-up delay-100 mt-5 max-w-xl text-[17px] leading-relaxed text-pearl/90">
                {d.hero.subtitle}
              </p>
              <div className="animate-fade-up delay-200 mt-7">
                <SmartSearch labels={d.smartSearch} />
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroVisual activeCities={coveredCities} />
            </div>
          </div>
        </Container>

        {/* Xidmət lenti — səhifənin yeganə marquee-si */}
        {marqueeServices.length > 5 && (
          <div className="relative border-t border-white/10 py-3">
            <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
              <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
                {[...marqueeServices, ...marqueeServices].map((s, i) => (
                  <Link
                    key={`${s.slug}-${i}`}
                    href={`/xidmetler/${s.slug}`}
                    className="flex shrink-0 items-center gap-2 rounded-full bg-iris-shadow px-4 py-1.5 text-sm font-medium text-pearl ring-1 ring-iris-border transition-colors hover:text-white hover:ring-iris-veil"
                  >
                    <ServiceIcon name={s.icon} url={s.iconUrl} className="h-4 w-4 text-clinical" />
                    {s.shortName ?? s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ============ METRİK LENTİ — Highlighted Metric Blocks ============ */}
      <div className="bg-iris-canvas">
        <Container>
          <div className="grid grid-cols-2 gap-3 py-10 sm:grid-cols-3 lg:grid-cols-5">
            <Metric value={`${stats.approvedCenters}`} label={d.home.statCenters} icon={<Building2 />} />
            <Metric value={`${stats.doctors}`} label={d.home.statDoctors} icon={<Stethoscope />} />
            <Metric value={`${stats.patients}`} label={d.home.statPatients} icon={<Users />} />
            <Metric value={`${allServices.length}`} label={d.home.statServices} icon={<ScanLine />} />
            <Metric value={`${stats.cities}`} label={d.home.statDistricts} icon={<MapPin />} />
          </div>
        </Container>
      </div>

      {/* ============ XİDMƏTLƏR — Dark Canvas Cards ============ */}
      <section className="bg-iris-canvas py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              {d.home.servicesTitle}
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-ash-2">
              {d.home.servicesDesc}
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredServices.map((s) => (
              <Link key={s.slug} href={`/xidmetler/${s.slug}`}>
                <div className="group h-full rounded-3xl bg-iris-shadow p-6 ring-1 ring-iris-border transition-all duration-300 hover:-translate-y-1 hover:ring-iris-veil">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[7px] bg-white/5 text-clinical ring-1 ring-iris-border">
                    <ServiceIcon name={s.icon} url={s.iconUrl} className="h-6 w-6" />
                  </div>
                  <h3 className="font-display mt-4 text-lg font-semibold tracking-tight text-white">
                    {s.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ash-2">
                    {s.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    {counts[s.slug] ? (
                      <span className="rounded-full border border-mint-vital/50 px-2.5 py-0.5 text-xs font-medium text-mint-vital">
                        {counts[s.slug]} {d.home.centerCount}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="flex items-center gap-1 text-sm font-medium text-clinical transition-transform group-hover:translate-x-1">
                      {d.home.more} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink
              href="/xidmetler"
              className="border border-white/25 bg-transparent text-white hover:bg-white/10"
            >
              {d.home.allServices} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* ============ NECƏ İŞLƏYİR ============ */}
      <section id="nece-ishleyir" className="relative overflow-hidden bg-observatory py-16 text-white sm:py-20">
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                {d.home.hiwTitle}
              </h2>
              <p className="mt-3 text-[17px] text-ash-2">
                {d.home.hiwDesc}
              </p>
              <ol className="mt-8 space-y-5">
                {[
                  { t: d.home.step1t, d: d.home.step1d },
                  { t: d.home.step2t, d: d.home.step2d },
                  { t: d.home.step3t, d: d.home.step3d },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iris-pulse text-sm font-semibold text-white shadow-[0_0_20px_rgba(60,57,185,0.4)]">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{step.t}</h3>
                      <p className="text-sm text-ash-2">{step.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <ButtonLink
                href="/rentgen-merkezleri"
                className="mt-8 bg-iris-pulse text-white shadow-[0_0_20px_rgba(60,57,185,0.4)] hover:bg-iris-glow"
              >
                {d.home.findCenter} <Search className="h-4 w-4" />
              </ButtonLink>
            </div>

            {/* Mobil: 2 sütun + kiçik kartlar (skrol azalır — istifadəçi istəyi) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FeatureTile icon={<Search />} title={d.home.tile1t} text={d.home.tile1d} />
              <FeatureTile icon={<MessageCircle />} title={d.home.tile2t} text={d.home.tile2d} />
              <FeatureTile icon={<ShieldCheck />} title={d.home.tile3t} text={d.home.tile3d} />
              <FeatureTile icon={<Users />} title={d.home.tile4t} text={d.home.tile4d} />
            </div>
          </div>
        </Container>
      </section>

      {/* ============ HƏKİM + MƏRKƏZ CTA CÜTÜ ============ */}
      <section className="bg-iris-canvas py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl bg-iris-shadow p-8 ring-1 ring-iris-border">
              <Stethoscope className="absolute -right-4 -top-4 h-28 w-28 text-white/5" />
              <div className="relative">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
                  {d.home.forDoctorsTitle}
                </h3>
                <p className="mt-3 text-ash-2">
                  {d.home.forDoctorsDesc}
                </p>
                <ButtonLink
                  href="/hekimler"
                  className="mt-6 border border-white/25 bg-transparent text-white hover:bg-white/10"
                >
                  {d.home.openReferral} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-iris-glow p-8">
              <Building2 className="absolute -right-4 -top-4 h-28 w-28 text-white/10" />
              <div className="relative">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
                  {d.home.forCentersTitle}
                </h3>
                <p className="mt-3 text-pearl/85">
                  {d.home.forCentersDesc}
                </p>
                <ButtonLink
                  href="/merkezler-ucun"
                  className="mt-6 bg-white text-iris-canvas hover:bg-pearl"
                >
                  {d.home.addCenter} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ============ PEARL İNVERSİYA — imza "hard cut" ============ */}
      <section className="bg-pearl py-16 text-iris-canvas sm:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                {d.home.centersTitle}
              </h2>
              <p className="mt-3 text-[17px] leading-relaxed text-iris-canvas/70">
                {d.home.centersDesc}
              </p>
            </div>
            <ButtonLink
              href="/rentgen-merkezleri"
              className="shrink-0 bg-iris-pulse text-white hover:bg-iris-glow"
            >
              {d.home.viewAll} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>

          {centers.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {centers.map((c) => (
                <CenterCard key={c.id} center={c} rating={ratings[c.id]} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-ash-2">
              <Building2 className="mx-auto h-10 w-10 text-fog-2" />
              <h3 className="font-display mt-4 text-lg font-semibold">
                {d.home.centersEmptyTitle}
              </h3>
              <p className="mt-2 text-sm text-iris-canvas/70">{d.home.centersEmptyDesc}</p>
              <ButtonLink href="/merkezler-ucun" className="mt-5 bg-iris-pulse text-white hover:bg-iris-glow">
                {d.home.addCenter}
              </ButtonLink>
            </div>
          )}

          {/* Təhlükəsizlik — compliance üslubunda blok */}
          <div className="mt-14 rounded-3xl bg-white ring-1 ring-ash-2">
            <div className="grid gap-6 p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-[7px] border border-ash-2 text-iris-canvas">
                <Radiation className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {d.home.safetyTitle}
                </h2>
                <p className="mt-3 max-w-3xl text-iris-canvas/70">
                  {d.home.safetyText}
                </p>
                <Link
                  href="/blog/dental-rentgen-tehlukelidirmi"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-iris-pulse hover:text-iris-glow"
                >
                  {d.home.readMore} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-14">
            <h2 className="font-display text-center text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              {d.home.faqTitle}
            </h2>
            <div className="mt-8">
              <FaqAccordion items={homeFaq} />
            </div>
          </div>
        </Container>
      </section>

      {/* ============ BLOQ — tünd qayıdış ============ */}
      {posts.length > 0 && (
        <section className="bg-iris-canvas py-16 sm:py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                {d.home.blogTitle}
              </h2>
              <ButtonLink
                href="/blog"
                className="shrink-0 border border-white/25 bg-transparent text-white hover:bg-white/10"
              >
                {d.home.allPosts} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`}>
                  <article className="group h-full overflow-hidden rounded-3xl bg-iris-shadow ring-1 ring-iris-border transition-all duration-300 hover:-translate-y-1 hover:ring-iris-veil">
                    {p.coverImage && (
                      <div className="relative aspect-[1200/630] overflow-hidden">
                        <Image
                          src={p.coverImage}
                          alt={p.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-xs font-medium text-clinical-soft">
                        {formatDateAz(p.publishedAt)}
                      </p>
                      <h3 className="font-display mt-2 text-lg font-semibold tracking-tight text-white">
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="mt-2 line-clamp-3 text-sm text-ash-2">
                          {p.excerpt}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-clinical">
                        {d.home.read} <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ============ FİNAL CTA — Iris Glow panel ============ */}
      <section className="bg-iris-canvas pb-24 pt-4">
        <Container>
          <div className="relative overflow-hidden rounded-[32px] bg-iris-glow px-6 py-16 text-center text-white sm:px-12">
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                {d.home.finalTitle}
              </h2>
              <p className="mt-4 text-pearl/85">
                {d.home.finalDesc}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/rentgen-merkezleri" size="lg" className="bg-white text-iris-canvas hover:bg-pearl">
                  {d.home.findCenter}
                </ButtonLink>
                <ButtonLink
                  href="/giris"
                  size="lg"
                  className="border border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  {d.home.registerLogin}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/* Impilo "Highlighted Metric Block": Iris Glow səth, böyük dəyər Clinical
 * Cyan-da (data = siyan semantikası), kölgəsiz. */
function Metric({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-iris-glow/35 p-5 ring-1 ring-iris-border">
      <div className="flex items-center gap-2 text-pearl/70 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      <div className="font-display mt-2 text-3xl font-semibold tracking-tight text-clinical sm:text-4xl">
        {value}
      </div>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-iris-shadow p-3.5 ring-1 ring-iris-border sm:p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-white/5 text-clinical ring-1 ring-iris-border sm:h-10 sm:w-10 [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
        {icon}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-white sm:mt-3 sm:text-base">{title}</h3>
      <p className="mt-1 text-xs text-ash-2 sm:text-sm">{text}</p>
    </div>
  );
}
