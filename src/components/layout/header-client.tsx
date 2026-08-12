"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { LocaleToggle } from "./locale-toggle";
import type { Locale } from "@/lib/i18n";

type Session = { role: string; dashboard: string; name: string } | null;
type Cta = { login: string; loginRegister: string; addCenter: string };

export function HeaderClient({
  nav,
  session,
  locale,
  cta,
}: {
  nav: { label: string; href: string }[];
  session: Session;
  locale: Locale;
  cta: Cta;
}) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  // Inside the CRM app the public site links and account button are noise
  // (empty nav = crm.* host; the path check covers /crm/* on the main host).
  const isCrm = nav.length === 0 || pathname === "/crm" || pathname.startsWith("/crm/");
  const links = isCrm ? [] : nav;
  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-slate-200/60 bg-white/80 shadow-[0_8px_30px_-18px_rgba(16,31,70,0.35)] backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="rentgen.az">
          <Image
            src="/mark.png"
            alt="rentgen.az"
            width={36}
            height={36}
            priority
            className="h-9 w-9"
          />
          <span className="font-display text-lg font-bold tracking-tight text-ink-900">
            rentgen<span className="text-[#0bb1f0]">.az</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleToggle locale={locale} />
          {isCrm ? null : session ? (
            <ButtonLink href={session.dashboard} size="sm" variant="primary">
              <LayoutDashboard className="h-4 w-4" />
              {session.name}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/giris" size="sm" variant="ghost">
                {cta.login}
              </ButtonLink>
              <ButtonLink
                href="/merkezler-ucun"
                size="sm"
                className="bg-spectrum border-0 text-white shadow-[0_10px_28px_-10px_rgba(124,58,237,0.7)] hover:opacity-95"
              >
                {cta.addCenter}
              </ButtonLink>
            </>
          )}
        </div>

        {isCrm ? (
          <div className="lg:hidden">
            <LocaleToggle locale={locale} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-800 lg:hidden"
            aria-label="Menyu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </div>

      {open && !isCrm && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <div className="px-1 pb-1">
                <LocaleToggle locale={locale} />
              </div>
              {session ? (
                <ButtonLink href={session.dashboard} variant="primary" onClick={close}>
                  <LayoutDashboard className="h-4 w-4" />
                  {session.name}
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/giris" variant="outline" onClick={close}>
                    {cta.loginRegister}
                  </ButtonLink>
                  <ButtonLink href="/merkezler-ucun" variant="primary" onClick={close}>
                    {cta.addCenter}
                  </ButtonLink>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
