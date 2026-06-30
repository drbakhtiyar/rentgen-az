import type { Metadata } from "next";
import { SITE_URL } from "./env";

export const SITE = {
  name: "Rentgen.az",
  shortName: "Rentgen.az",
  title: "Rentgen.az — Bakıda dental rentgen və 3D tomoqrafiya mərkəzləri",
  description:
    "Bakıda və Azərbaycanda dental rentgen, panoramik rentgen, sefalometrik rentgen və 3D dental tomoqrafiya (CBCT) mərkəzlərini tapın. Xidmət və rayona görə axtarın, birbaşa əlaqə saxlayın.",
  locale: "az_AZ",
  twitter: "@rentgenaz",
  defaultOg: "/og-default.png",
};

type BuildMetaArgs = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
};

export function canonical(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords,
  ogImage,
  noIndex,
}: BuildMetaArgs = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE.name}` : SITE.title;
  const desc = description ?? SITE.description;
  const url = canonical(path);
  // When ogImage isn't provided, the app/opengraph-image.tsx file convention
  // supplies a branded default automatically.
  const images = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }]
    : undefined;

  return {
    title: title ?? SITE.title,
    description: desc,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: fullTitle,
      description: desc,
      url,
      locale: SITE.locale,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

// ----------------------------- JSON-LD -----------------------------

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE.description,
    areaServed: "AZ",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE_URL,
    inLanguage: "az",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/rentgen-merkezleri?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function medicalBusinessJsonLd(center: {
  name: string;
  slug: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  images?: string[];
  lat?: number | null;
  lng?: number | null;
  services?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "LocalBusiness", "Dentist"],
    name: center.name,
    url: canonical(`/rentgen-merkezleri/${center.slug}`),
    telephone: center.phone,
    image: center.images?.length ? center.images : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: center.address ?? undefined,
      addressLocality: center.city ?? "Bakı",
      addressCountry: "AZ",
    },
    geo:
      center.lat != null && center.lng != null
        ? { "@type": "GeoCoordinates", latitude: center.lat, longitude: center.lng }
        : undefined,
    medicalSpecialty: "Radiology",
    availableService: center.services?.map((s) => ({
      "@type": "MedicalProcedure",
      name: s,
    })),
  };
}

export function articleJsonLd(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ?? `${SITE_URL}${SITE.defaultOg}`,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    author: { "@type": "Organization", name: SITE.name },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: canonical(`/blog/${post.slug}`),
    inLanguage: "az",
  };
}

export function serviceJsonLd(service: {
  name: string;
  slug: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: service.name,
    description: service.description,
    url: canonical(`/xidmetler/${service.slug}`),
    procedureType: "https://schema.org/DiagnosticProcedure",
  };
}
