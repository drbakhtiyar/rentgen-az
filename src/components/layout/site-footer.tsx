import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin } from "lucide-react";

/** WhatsApp loqosu KONTUR üslubunda (2026-08-21, istifadəçi istəyi) — yaşıl
 *  brend rəngi yox, lucide ikonları kimi cari rənglə cızılır. */
function WhatsAppOutline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* dairəvi qabarcıq + sol-alt quyruq (WhatsApp silueti) */}
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17 8.6 8.6 0 0 1-4.1-1L3.5 20.5l1-4.3a8.5 8.5 0 0 1 7.5-12.7Z" />
      {/* dəstək (handset) cizgisi */}
      <path d="M9.2 8.4c-.3.7-.2 1.6.2 2.4.6 1.2 1.6 2.3 2.9 3 .8.4 1.7.6 2.4.3.4-.2.8-.5.9-.9l.1-.5c0-.2-.1-.4-.3-.5l-1.5-.8a.5.5 0 0 0-.6.1l-.4.4c-.1.1-.3.2-.5.1a5 5 0 0 1-2.2-2.2c-.1-.2 0-.4.1-.5l.4-.4c.2-.2.2-.4.1-.6l-.8-1.5a.53.53 0 0 0-.5-.3h-.5c-.4.2-.7.5-.8.9Z" />
    </svg>
  );
}
import { Container } from "@/components/ui/container";
import { getActiveServices } from "@/lib/queries";
import { pickCrossCategoryRandom } from "@/lib/random-services";
import { PLATFORM_WHATSAPP_DISPLAY, PLATFORM_WHATSAPP_URL } from "@/lib/constants";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { serviceNameRu } from "@/content/services-ru";

export async function SiteFooter() {
  const year = 2026;
  const locale = await getLocale();
  const d = getDict(locale);
  const cols = [
    {
      title: d.footer.platform,
      links: [
        { label: d.nav.centers, href: "/rentgen-merkezleri" },
        { label: d.nav.services, href: "/xidmetler" },
        { label: d.nav.doctors, href: "/hekimler" },
        { label: d.nav.forCenters, href: "/merkezler-ucun" },
        { label: d.nav.pricing, href: "/paketler" },
      ],
    },
    {
      title: d.footer.company,
      links: [
        { label: d.footer.about, href: "/haqqimizda" },
        { label: d.footer.faq, href: "/faq" },
        { label: d.nav.contact, href: "/elaqe" },
        { label: d.footer.privacy, href: "/gizlilik-siyaseti" },
        { label: d.footer.terms, href: "/istifade-shertleri" },
      ],
    },
  ];
  // Hər renderde fərqli 5 xidmət — hər biri fərqli kateqoriyadan (2026-08-16:
  // 6 → 5, digər sütunlarla eyni hündürlük). Əvvəl yalnız `featured` (7 dental)
  // göstərilirdi; random rotasiya həm siyahını qısa saxlayır, həm də zamanla
  // bütün xidmət səhifələrinə footer linki paylayır.
  //
  // UZUN ADLAR SÜZÜLÜR (2026-08-16): «Boyun yumşaq toxumalarının rentgeni» kimi
  // adlar sütunda iki sətrə düşüb proporsiyanı pozurdu. Hədd göstəriləcək dilə
  // görə hesablanır (AZ: shortName ?? name, RU: serviceNameRu). ≤22 simvol
  // 112 xidmətdən 90-ı saxlayır və 15 kateqoriyanın hamısı təmsil olunur, ona
  // görə rotasiyanın müxtəlifliyi itmir. Süzgəc bir səbəbdən boş qalsa tam
  // siyahıya qayıdılır.
  const MAX_LABEL = 22;
  const allActive = await getActiveServices();
  const footerLabel = (s: { name: string; shortName?: string | null }) =>
    locale === "ru" ? serviceNameRu(s.name) : (s.shortName ?? s.name);
  const shortEnough = allActive.filter((s) => footerLabel(s).length <= MAX_LABEL);
  const footerServices = pickCrossCategoryRandom(
    shortEnough.length >= 5 ? shortEnough : allActive,
    5,
  );
  return (
    <footer className="relative mt-auto overflow-hidden bg-iris-canvas text-pearl/80">
      {/* Impilo: siyan→bənövşəyi hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-clinical via-iris-veil to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-25" />
      <Container className="relative py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5" aria-label="rentgen.az">
              <Image
                src="/mark-square.png"
                alt="rentgen.az"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl"
              />
              <span className="font-display text-lg font-bold text-white">
                rentgen<span className="text-[#0bb1f0]">.az</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {d.footer.tagline}
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-400" />{" "}
                {locale === "ru" ? "Баку, Азербайджан" : "Bakı, Azərbaycan"}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-400" /> info@rentgen.az
              </p>
              <p className="flex items-center gap-2">
                <WhatsAppOutline className="h-4 w-4 text-brand-400" />
                <a
                  href={PLATFORM_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener"
                  className="transition-colors hover:text-white"
                >
                  {PLATFORM_WHATSAPP_DISPLAY} (WhatsApp)
                </a>
              </p>
            </div>
          </div>

          {/* Mobil (2026-08-16): Platforma və Şirkət yan-yana — alt-alta düzülüş
              footeri həddən artıq uzadırdı. `lg:contents` sarğını desktopda
              şəffaf edir, yəni 5 sütunlu düzülüş olduğu kimi qalır. */}
          <div className="grid grid-cols-2 gap-8 lg:contents">
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </div>

          {/* Xidmət linkləri mobildə gizlidir — kataloq onsuz da naviqasiyadadır */}
          <div className="hidden lg:block">
            <h3 className="text-sm font-semibold text-white">{d.nav.services}</h3>
            <ul className="mt-4 space-y-2.5">
              {footerServices.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/xidmetler/${s.slug}`}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {locale === "ru" ? serviceNameRu(s.name) : (s.shortName ?? s.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {year} Rentgen.az — {d.footer.rights}</p>
          {/* Axiora MMC — layihənin sahibi olan çətir şirkət (axiora.az) */}
          <a
            href="https://axiora.az"
            target="_blank"
            rel="noopener"
            title="Axiora MMC"
            className="group flex items-center gap-2 transition-colors hover:text-slate-300"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <defs>
                <linearGradient
                  id="axgrad-rf"
                  x1="20"
                  y1="10"
                  x2="55"
                  y2="95"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00C2FF" />
                  <stop offset="1" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <path d="M50 14 L84 88" stroke="#e2e8f0" strokeWidth="15" strokeLinecap="round" />
              <path d="M50 14 L16 88" stroke="url(#axgrad-rf)" strokeWidth="15" strokeLinecap="round" />
              <circle cx="52" cy="66" r="9.5" fill="#2563EB" />
            </svg>
            <span className="font-semibold tracking-[0.18em] text-slate-300 group-hover:text-white">
              AXIORA
            </span>
          </a>
          <p className="text-center sm:whitespace-nowrap sm:text-right">
            {d.footer.disclaimer}
          </p>
        </div>
      </Container>
    </footer>
  );
}
