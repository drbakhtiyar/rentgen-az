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

  // Impilo üslubu (2026-08-12): bütün ictimai səhifələrdə header tünd (Deep
  // Iris) rejimdədir — səhifə başlıqları da tünddür, bütöv görünür. Giriş/
  // qeydiyyat və token səhifələri köhnə açıq headerdə qalır.
  const darkNav =
    pathname === "/" ||
    [
      "/rentgen-merkezleri",
      "/xidmetler",
      "/hekimler",
      "/paketler",
      "/blog",
      "/faq",
      "/elaqe",
      "/merkezler-ucun",
      "/hekimler-ucun",
      "/gizlilik-siyaseti",
      "/istifade-shertleri",
      "/bize-qoshul",
      "/telimat",
    ].some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        darkNav
          ? scrolled
            ? "border-b border-white/10 bg-[#16165c]/85 backdrop-blur-xl"
            : "bg-[#16165c]"
          : scrolled
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
            className={cn("h-9 w-9", darkNav && "brightness-0 invert")}
          />
          <span
            className={cn(
              "font-display text-lg font-bold tracking-tight",
              darkNav ? "text-white" : "text-ink-900",
            )}
          >
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
                  darkNav
                    ? active
                      ? "bg-white/10 text-white"
                      : "text-pearl/80 hover:bg-white/10 hover:text-white"
                    : active
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
              <ButtonLink
                href="/giris"
                size="sm"
                variant="ghost"
                className={darkNav ? "text-pearl/85 hover:bg-white/10 hover:text-white" : undefined}
              >
                {cta.login}
              </ButtonLink>
              <ButtonLink
                href="/merkezler-ucun"
                size="sm"
                className={
                  darkNav
                    ? "bg-iris-pulse text-white shadow-[0_0_20px_rgba(60,57,185,0.4)] hover:bg-iris-glow"
                    : undefined
                }
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
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden",
              darkNav
                ? "border-white/20 bg-white/10 text-white"
                : "border-slate-200 bg-white text-ink-800",
            )}
            aria-label="Menyu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
      </div>

      {open && !isCrm && (
        <div
          className={cn(
            "lg:hidden",
            darkNav ? "border-t border-white/10 bg-[#16165c]" : "border-t border-slate-200 bg-white",
          )}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium",
                  darkNav
                    ? "text-pearl/85 hover:bg-white/10 hover:text-white"
                    : "text-slate-700 hover:bg-slate-100",
                )}
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
                  <ButtonLink
                    href="/giris"
                    variant="outline"
                    onClick={close}
                    className={
                      darkNav
                        ? "border-white/25 bg-transparent text-white hover:bg-white/10"
                        : undefined
                    }
                  >
                    {cta.loginRegister}
                  </ButtonLink>
                  <ButtonLink
                    href="/merkezler-ucun"
                    onClick={close}
                    className={darkNav ? "bg-iris-pulse text-white hover:bg-iris-glow" : undefined}
                  >
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
