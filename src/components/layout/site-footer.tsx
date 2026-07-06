import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SERVICES } from "@/lib/constants";

const footerServices = SERVICES.filter((s) => s.featured).slice(0, 6);

const cols = [
  {
    title: "Platforma",
    links: [
      { label: "Rentgen mərkəzləri", href: "/rentgen-merkezleri" },
      { label: "Xidmətlər", href: "/xidmetler" },
      { label: "Həkimlər üçün", href: "/hekimler-ucun" },
      { label: "Mərkəzlər üçün", href: "/merkezler-ucun" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Şirkət",
    links: [
      { label: "Haqqımızda", href: "/#nece-ishleyir" },
      { label: "FAQ", href: "/faq" },
      { label: "Əlaqə", href: "/elaqe" },
      { label: "Gizlilik siyasəti", href: "/gizlilik-siyaseti" },
      { label: "İstifadə şərtləri", href: "/istifade-shertleri" },
    ],
  },
];

export function SiteFooter() {
  const year = 2026;
  return (
    <footer className="relative mt-auto overflow-hidden bg-ink-950 text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-40" />
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
              Azərbaycanda dental rentgen, panoramik rentgen, sefalometrik rentgen
              və 3D dental tomoqrafiya (CBCT) mərkəzlərini bir platformada tapın.
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-400" /> Bakı, Azərbaycan
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-400" /> info@rentgen.az
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-400" /> +994 50 000 00 00
              </p>
            </div>
          </div>

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

          <div>
            <h3 className="text-sm font-semibold text-white">Xidmətlər</h3>
            <ul className="mt-4 space-y-2.5">
              {footerServices.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/xidmetler/${s.slug}`}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {s.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {year} Rentgen.az — Bütün hüquqlar qorunur.</p>
          <p className="max-w-md text-center sm:text-right">
            Platformadakı məlumat ümumi xarakter daşıyır və həkim məsləhətini əvəz
            etmir.
          </p>
        </div>
      </Container>
    </footer>
  );
}
