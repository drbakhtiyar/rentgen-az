import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { headers } from "next/headers";
import {
  SITE,
  buildMetadata,
  hreflangAlternates,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { getLocale } from "@/lib/i18n-server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Panels/private areas have no localized (/ru) version.
const PRIVATE_RE = /^\/(admin|panel|merkez|hekim|crm|kabinet|giris|admin-giris)(\/|$)/;

// Canonical + bilingual hreflang are set here (once), locale- and path-aware,
// so every page gets correct /ru alternates without touching its own metadata.
export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const path = h.get("x-pathname") || "/";
  const locale = await getLocale();
  const isPublic = !PRIVATE_RE.test(path);
  return {
    metadataBase: new URL(SITE_URL),
    ...buildMetadata(),
    applicationName: SITE.name,
    authors: [{ name: SITE.name }],
    alternates: isPublic
      ? hreflangAlternates(path, locale)
      : { canonical: `${SITE_URL}${path === "/" ? "" : path}` },
    // Icons (favicon.ico, icon.png, apple-icon.png) are auto-detected from app/.
    // Google Search Console verification (HTML-tag method) via env.
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#08142b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink-900">
        <Script
          id="ld-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <Script
          id="ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics />
        {/* Axiora panel analitikası (layihələrarası mini-izləyici). */}
        <Script
          src="https://axiora.az/a.js"
          data-project="rentgen.az"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
