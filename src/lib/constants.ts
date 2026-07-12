/** Static catalog data: services, cities/districts, exam types, navigation. */
import { slugify } from "./utils";

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

/**
 * Full radiology taxonomy grouped by body region / modality. Existing dental
 * services keep their hand-tuned slugs (category "Dental"); everything below is
 * generated so we ship ~90 SEO landing pages targeting long-tail "X rentgeni"
 * searches. Slugs are derived deterministically from the AZ name.
 */
const TAXONOMY: { category: string; icon: string; names: string[] }[] = [
  {
    category: "Baş və üz",
    icon: "Brain",
    names: [
      "Kəllə rentgeni",
      "Burun sümükləri rentgeni",
      "Üz sümükləri rentgeni",
      "Göz yuvası (orbita) rentgeni",
      "Alt çənə rentgeni",
      "Üst çənə rentgeni",
      "Temporomandibulyar oynaq (TMJ) rentgeni",
      "Mastoid rentgeni",
      "Paranazal sinusların rentgeni",
    ],
  },
  {
    category: "Boyun",
    icon: "Bone",
    names: ["Boyun rentgeni", "Boyun fəqərələri rentgeni", "Boyun yumşaq toxumalarının rentgeni"],
  },
  {
    category: "Sinə",
    icon: "HeartPulse",
    names: [
      "Ağciyər rentgeni",
      "Döş qəfəsi rentgeni",
      "Qabırğa rentgeni",
      "Sternum (döş sümüyü) rentgeni",
      "Körpücük sümüyü rentgeni",
    ],
  },
  {
    category: "Onurğa",
    icon: "Bone",
    names: [
      "Boyun onurğası rentgeni",
      "Döş onurğası rentgeni",
      "Bel onurğası rentgeni",
      "Oma (sakrum) rentgeni",
      "Quyruq sümüyü (koksiks) rentgeni",
      "Tam onurğa rentgeni",
      "Skolioz rentgeni",
    ],
  },
  {
    category: "Çiyin və yuxarı ətraf",
    icon: "Bone",
    names: [
      "Çiyin rentgeni",
      "Kürək sümüyü rentgeni",
      "Bazu rentgeni",
      "Dirsək rentgeni",
      "Bilək rentgeni",
      "Əl rentgeni",
      "Barmaq rentgeni",
    ],
  },
  {
    category: "Çanaq və omba",
    icon: "Bone",
    names: ["Çanaq rentgeni", "Omba oynağı rentgeni", "Sakroiliak oynaq rentgeni"],
  },
  {
    category: "Aşağı ətraf",
    icon: "Bone",
    names: [
      "Bud rentgeni",
      "Diz rentgeni",
      "Baldır rentgeni",
      "Topuq rentgeni",
      "Ayaq rentgeni",
      "Ayaq barmaqları rentgeni",
      "Daban rentgeni",
    ],
  },
  {
    category: "Uşaqlar üçün",
    icon: "Baby",
    names: [
      "Uşaq skelet rentgeni",
      "Bud-çanaq skrininqi",
      "Sümük yaşının təyini (Bone Age)",
      "Uşaqlarda skolioz rentgeni",
    ],
  },
  {
    category: "Floroskopiya",
    icon: "Activity",
    names: [
      "Qida borusunun kontrast müayinəsi",
      "Mədə-bağırsaq kontrast müayinəsi",
      "Barium udma testi",
      "Histerosalpinqoqrafiya (HSG)",
      "Venoqrafiya",
      "Fistuloqrafiya",
    ],
  },
  {
    category: "Mammoqrafiya",
    icon: "ScanLine",
    names: [
      "Rəqəmsal mammoqrafiya",
      "Skrininq mammoqrafiyası",
      "Diaqnostik mammoqrafiya",
      "Tomosintez (3D mammoqrafiya)",
    ],
  },
  {
    category: "Densitometriya",
    icon: "Activity",
    names: [
      "Sümük mineral sıxlığı ölçülməsi (DEXA)",
      "Bel DEXA",
      "Bud DEXA",
      "Tam bədən DEXA",
    ],
  },
  {
    category: "Kompüter tomoqrafiyası (KT)",
    icon: "ScanFace",
    names: [
      "Baş KT",
      "Beyin KT",
      "Sinus KT",
      "Temporal sümük KT",
      "Boyun KT",
      "Ağciyər KT",
      "Qarın KT",
      "Kiçik çanaq KT",
      "Onurğa KT",
      "Diz KT",
      "Ayaq KT",
      "Əl KT",
      "Ürək KT",
      "Koronar KT-angioqrafiya",
    ],
  },
  {
    category: "MRT",
    icon: "Scan",
    names: [
      "Baş MRT",
      "Beyin MRT",
      "Hipofiz MRT",
      "Boyun MRT",
      "Bel MRT",
      "Diz MRT",
      "Çiyin MRT",
      "Qarın MRT",
      "Çanaq MRT",
      "Ürək MRT",
    ],
  },
  {
    category: "USM",
    icon: "ScanLine",
    names: [
      "Qarın USM",
      "Tiroid USM",
      "Süd vəzi USM",
      "Doppler USM",
      "Hamiləlik USM",
      "Uşaq USM",
    ],
  },
];

/** Flatten the taxonomy into ServiceSeed rows with deterministic, unique slugs. */
function buildTaxonomyServices(): ServiceSeed[] {
  const seen = new Set<string>();
  const out: ServiceSeed[] = [];
  TAXONOMY.forEach((group, gi) => {
    const base = (gi + 1) * 100;
    group.names.forEach((name, i) => {
      let slug = slugify(name);
      while (seen.has(slug)) slug = `${slug}-x`;
      seen.add(slug);
      const shortName = name.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();
      out.push({
        slug,
        name,
        shortName: shortName.length <= 60 ? shortName : shortName.slice(0, 60),
        description: `${name} — Bakıda bu müayinəni göstərən təsdiqlənmiş mərkəzlər, qiymət və ünvanlar bir platformada.`,
        icon: group.icon,
        category: group.category,
        order: base + i + 1,
        featured: false,
      });
    });
  });
  return out;
}

export const SERVICES: ServiceSeed[] = [
  {
    slug: "dental-rentgen",
    name: "Dental rentgen",
    shortName: "Dental rentgen",
    description:
      "Diş və ətraf toxumaların qiymətləndirilməsi üçün rəqəmsal dental rentgen görüntüləməsi.",
    icon: "ScanLine",
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
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
    category: "Dental",
    order: 11,
    featured: false,
  },
  ...buildTaxonomyServices(),
];

export const FEATURED_SERVICE_SLUGS = SERVICES.filter((s) => s.featured).map(
  (s) => s.slug,
);

/** Canonical service categories in catalog order (for admin category picker). */
export const SERVICE_CATEGORIES: string[] = Array.from(
  new Set(SERVICES.map((s) => s.category)),
);

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}

/**
 * Bütün Azərbaycan şəhər və rayonları (mərkəz qeydiyyatda buradan seçir).
 * Slug-lar avtomatik yaradılır. Axtarış paneli isə YALNIZ mərkəzi olan
 * şəhərləri dinamik göstərir (getCitiesWithCenters).
 */
const CITY_NAMES: string[] = [
  // Bakı və rayonları
  "Bakı",
  "Bakı — Binəqədi",
  "Bakı — Qaradağ",
  "Bakı — Xəzər",
  "Bakı — Xətai",
  "Bakı — Yasamal",
  "Bakı — Nərimanov",
  "Bakı — Nəsimi",
  "Bakı — Nizami",
  "Bakı — Pirallahı",
  "Bakı — Sabunçu",
  "Bakı — Səbail",
  "Bakı — Suraxanı",
  // Respublika əhəmiyyətli şəhərlər
  "Sumqayıt",
  "Gəncə",
  "Mingəçevir",
  "Şirvan",
  "Naftalan",
  "Yevlax",
  "Şəki",
  // Rayonlar (əlifba sırası)
  "Abşeron",
  "Ağcabədi",
  "Ağdam",
  "Ağdaş",
  "Ağstafa",
  "Ağsu",
  "Astara",
  "Balakən",
  "Beyləqan",
  "Bərdə",
  "Biləsuvar",
  "Cəbrayıl",
  "Cəlilabad",
  "Daşkəsən",
  "Füzuli",
  "Gədəbəy",
  "Goranboy",
  "Göyçay",
  "Göygöl",
  "Hacıqabul",
  "İmişli",
  "İsmayıllı",
  "Kəlbəcər",
  "Kürdəmir",
  "Qax",
  "Qazax",
  "Qəbələ",
  "Qobustan",
  "Quba",
  "Qubadlı",
  "Qusar",
  "Laçın",
  "Lənkəran",
  "Lerik",
  "Masallı",
  "Neftçala",
  "Oğuz",
  "Saatlı",
  "Sabirabad",
  "Salyan",
  "Samux",
  "Siyəzən",
  "Şabran",
  "Şamaxı",
  "Şəmkir",
  "Şuşa",
  "Tərtər",
  "Tovuz",
  "Ucar",
  "Xaçmaz",
  "Xızı",
  "Xocalı",
  "Xocavənd",
  "Yardımlı",
  "Zaqatala",
  "Zəngilan",
  "Zərdab",
  // Naxçıvan MR
  "Naxçıvan",
  "Naxçıvan — Babək",
  "Naxçıvan — Culfa",
  "Naxçıvan — Kəngərli",
  "Naxçıvan — Ordubad",
  "Naxçıvan — Sədərək",
  "Naxçıvan — Şahbuz",
  "Naxçıvan — Şərur",
];

export const CITIES: { name: string; slug: string; order: number }[] =
  CITY_NAMES.map((name, i) => ({ name, slug: slugify(name), order: i + 1 }));

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

/** Dental specializations — doctors pick one or more. */
export const DENTAL_SPECIALIZATIONS: string[] = [
  "Ümumi diş həkimi (Terapevt)",
  "Ortodont",
  "İmplantoloq",
  "Diş-üz-çənə cərrahı",
  "Ortoped (Protezist)",
  "Pedodont (Uşaq diş həkimi)",
  "Endodont (Kanal müalicəsi)",
  "Parodontoloq (Diş əti müalicəsi)",
  "Estetik diş həkimi",
  "Gnatoloq",
  "Radioloq (Diş radiologiyası)",
];

export const MAIN_NAV: { label: string; href: string }[] = [
  { label: "Rentgen mərkəzləri", href: "/rentgen-merkezleri" },
  { label: "Xidmətlər", href: "/xidmetler" },
  { label: "Həkimlər", href: "/hekimler" },
  { label: "Həkimlər", href: "/hekimler" },
  { label: "Mərkəzlər üçün", href: "/merkezler-ucun" },
  { label: "Blog", href: "/blog" },
  { label: "Əlaqə", href: "/elaqe" },
];
