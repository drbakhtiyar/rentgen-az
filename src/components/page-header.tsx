import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Container } from "@/components/ui/container";

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-300">
      <Link href="/" className="flex items-center gap-1 hover:text-white">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          {item.href ? (
            <Link href={item.href} className="hover:text-white">
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
    <section className="relative overflow-hidden bg-ink-950 text-white">
      {bgImageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/25" />
        </>
      )}
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="glow absolute -left-20 -top-10 h-72 w-72 opacity-40" />
      <div className="glow-cyan absolute right-0 top-10 h-72 w-72 opacity-30" />
      <Container className="relative py-12 lg:py-16">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && (
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-300">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {description}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </section>
  );
}
