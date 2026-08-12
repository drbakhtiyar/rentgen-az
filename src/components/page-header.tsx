import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Container } from "@/components/ui/container";

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-pearl/60">
      <Link href="/" className="flex items-center gap-1 transition-colors hover:text-white">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-fog-2" />
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-white">
              {item.name}
            </Link>
          ) : (
            <span className="text-white">{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* Impilo üslubu (2026-08-12): Deep Iris "rəsədxana" fonu, Manrope 600 sıx
 * tracking, siyan eyebrow. Bütün ictimai daxili səhifələrin başlığıdır. */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  bgImageUrl,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  children?: React.ReactNode;
  /** Branding banner as the hero backdrop (e.g. Platinum doctor banner);
   * a left-side overlay keeps the title readable. */
  bgImageUrl?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-observatory text-white">
      {bgImageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-iris-canvas via-iris-canvas/80 to-iris-canvas/25" />
        </>
      )}
      <div className="absolute inset-0 bg-grid-dark opacity-25" />
      <Container className="relative py-12 lg:py-16">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && (
          <span className="animate-fade-up mt-4 inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.14em] text-clinical">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display animate-fade-up delay-100 mt-3 max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-[3.25rem]">
          {title}
        </h1>
        {description && (
          <p className="animate-fade-up delay-200 mt-4 max-w-2xl text-[17px] leading-relaxed text-pearl/85">
            {description}
          </p>
        )}
        {children && <div className="animate-fade-up delay-200 mt-6">{children}</div>}
      </Container>
    </section>
  );
}
