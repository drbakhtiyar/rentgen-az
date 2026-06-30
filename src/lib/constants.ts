/** Static catalog data: services, cities/districts, exam types, navigation. */

export type ServiceSeed = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: string; // lucide-react icon name
  category: string;
  order: number;
  /** if true, has a dedicated SEO landing page under /xidmetler/[slug] */
  featured: boolean;
};

export const SERVICES: ServiceSeed[] = [
  {
    slug: "dental-rentgen",
    name: "Dental rentgen",
    shortName: "Dental rentgen",
    description:
      "Diş və ətraf toxumaların qiymətləndirilməsi üçün rəqəmsal dental rentgen görüntüləməsi.",
    icon: "ScanLine",
    category: "Rentgen",
    order: 1,
    featured: true,
  },
  {
    slug: "dis-rentgeni",
    name: "Diş rentgeni",
    shortName: "Diş rentgeni",
    description:
      "Tək dişin və ya bir neçə dişin detallı qiymətləndirilməsi üçün periapikal diş rentgeni.",
    icon: "ScanSearch",
    category: "Rentgen",
    order: 2,
    featured: false,
  },
  {
    slug: "panoramik-rentgen",
    name: "Panoramik rentgen",
    shortName: "Panoramik",
    description:
      "Hər iki çənənin, bütün dişlərin və ətraf strukturların tək görüntüdə icmalı (OPG).",
    icon: "PanelsTopLeft",
    category: "Rentgen",
    order: 3,
    featured: true,
  },
  {
    slug: "sefalometrik-rentgen",
    name: "Sefalometrik rentgen",
    shortName: "Sefalometrik",
    description:
      "Ortodontik planlama üçün baş və çənə nisbətlərinin yandan görüntülənməsi.",
    icon: "Ruler",
    category: "Rentgen",
    order: 4,
    featured: true,
  },
  {
    slug: "3d-tomoqrafiya",
    name: "3D dental tomoqrafiya",
    shortName: "3D tomoqrafiya",
    description:
      "Çənə və diş strukturlarının üçölçülü, yüksək detallı qiymətləndirilməsi.",
    icon: "Box",
    category: "Tomoqrafiya",
    order: 5,
    featured: true,
  },
  {
    slug: "cbct",
    name: "CBCT (konus-şüalı kompüter tomoqrafiya)",
    shortName: "CBCT",
    description:
      "Aşağı dozalı konus-şüalı kompüter tomoqrafiya ilə dəqiq üçölçülü diaqnostika.",
    icon: "ScanFace",
    category: "Tomoqrafiya",
    order: 6,
    featured: true,
  },
  {
    slug: "implant-tomoqrafiya",
    name: "İmplant öncəsi tomoqrafiya",
    shortName: "İmplant tomoqrafiya",
    description:
      "İmplant yerləşdirilməsindən əvvəl sümük həcminin və anatomiyanın qiymətləndirilməsi.",
    icon: "Layers",
    category: "Tomoqrafiya",
    order: 7,
    featured: true,
  },
  {
    slug: "agil-disi-rentgeni",
    name: "Ağıl dişi üçün rentgen",
    shortName: "Ağıl dişi",
    description:
      "Ağıl dişinin vəziyyətinin və ətraf sinirlərlə əlaqəsinin qiymətləndirilməsi.",
    icon: "Stethoscope",
    category: "Rentgen",
    order: 8,
    featured: true,
  },
  {
    slug: "ortodontiya-rentgeni",
    name: "Ortodontik rentgen",
    shortName: "Ortodontiya",
    description:
      "Ortodontik müalicədən əvvəl diş və çənə vəziyyətinin görüntülənməsi.",
    icon: "AlignHorizontalDistributeCenter",
    category: "Rentgen",
    order: 9,
    featured: false,
  },
  {
    slug: "cene-sumuyu-analizi",
    name: "Çənə sümüyü analizi",
    shortName: "Çənə analizi",
    description:
      "Çənə sümüyünün sıxlığının və strukturunun ətraflı qiymətləndirilməsi.",
    icon: "Activity",
    category: "Tomoqrafiya",
    order: 10,
    featured: false,
  },
  {
    slug: "sinus-cene-anatomiyasi",
    name: "Sinus və çənə anatomiyası qiymətləndirilməsi",
    shortName: "Sinus qiymətləndirmə",
    description:
      "Sinus lift və digər müdaxilələrdən əvvəl sinus və çənə anatomiyasının analizi.",
    icon: "Wind",
    category: "Tomoqrafiya",
    order: 11,
    featured: false,
  },
];

export const FEATURED_SERVICE_SLUGS = SERVICES.filter((s) => s.featured).map(
  (s) => s.slug,
);

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}

/** Cities & Baku districts. */
export const CITIES: { name: string; slug: string; order: number }[] = [
  { name: "Bakı", slug: "baki", order: 1 },
  { name: "Bakı — Nəsimi", slug: "baki-nesimi", order: 2 },
  { name: "Bakı — Yasamal", slug: "baki-yasamal", order: 3 },
  { name: "Bakı — Nərimanov", slug: "baki-nerimanov", order: 4 },
  { name: "Bakı — Xətai", slug: "baki-xetai", order: 5 },
  { name: "Bakı — Sabunçu", slug: "baki-sabuncu", order: 6 },
  { name: "Bakı — Binəqədi", slug: "baki-bineqedi", order: 7 },
  { name: "Bakı — Nizami", slug: "baki-nizami", order: 8 },
  { name: "Bakı — Suraxanı", slug: "baki-suraxani", order: 9 },
  { name: "Bakı — Qaradağ", slug: "baki-qaradag", order: 10 },
  { name: "Bakı — Xəzər", slug: "baki-xezer", order: 11 },
  { name: "Bakı — Pirallahı", slug: "baki-pirallahi", order: 12 },
  { name: "Sumqayıt", slug: "sumqayit", order: 13 },
  { name: "Gəncə", slug: "gence", order: 14 },
  { name: "Mingəçevir", slug: "mingecevir", order: 15 },
  { name: "Şirvan", slug: "shirvan", order: 16 },
  { name: "Lənkəran", slug: "lenkeran", order: 17 },
  { name: "Naxçıvan", slug: "naxcivan", order: 18 },
];

/** Exam types used in the doctor referral form. */
export const EXAM_TYPES: string[] = [
  "Panoramik rentgen",
  "Sefalometrik rentgen",
  "3D dental tomoqrafiya",
  "CBCT",
  "İmplant öncəsi tomoqrafiya",
  "Ağıl dişi üçün rentgen",
  "Ortodontik rentgen",
  "Çənə sümüyü analizi",
  "Sinus qiymətləndirilməsi",
  "Digər",
];

export const MAIN_NAV: { label: string; href: string }[] = [
  { label: "Rentgen mərkəzləri", href: "/rentgen-merkezleri" },
  { label: "Xidmətlər", href: "/xidmetler" },
  { label: "Həkimlər üçün", href: "/hekimler-ucun" },
  { label: "Mərkəzlər üçün", href: "/merkezler-ucun" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Əlaqə", href: "/elaqe" },
];
