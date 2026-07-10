import type { Metadata } from "next";
import {
  Sparkles,
  Star,
  Crown,
  Gem,
  Building2,
  Stethoscope,
  Check,
  HardDrive,
  Info,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";

// Hidden internal draft — not linked in nav/footer, excluded from sitemap, noindex.
export const metadata: Metadata = buildMetadata({
  title: "İstifadə paketləri (daxili qaralama)",
  description: "Mərkəzlər və həkimlər üçün paket qiymətləri və imkanları — daxili baxış üçün.",
  path: "/paketler",
  noIndex: true,
});

type Tier = {
  name: string;
  price: string;
  period: string;
  tagline: string;
  icon: React.ReactNode;
  accent: string; // tailwind classes for the header band
  popular?: boolean;
  features: string[];
};

const centerTiers: Tier[] = [
  {
    name: "Free",
    price: "0",
    period: "AZN / ay",
    tagline: "Başlamaq üçün — platformada görün",
    icon: <Sparkles className="h-5 w-5" />,
    accent: "text-slate-600 bg-slate-100",
    features: [
      "Baza mərkəz profili",
      "50 GB bulud storage (rentgen faylları)",
      "5 şəkil",
      "Standart axtarış sırası",
      "Aylıq məhdud pasiyent müraciəti",
      "Rəylər və reytinq",
    ],
  },
  {
    name: "Silver",
    price: "29",
    period: "AZN / ay",
    tagline: "Aktiv mərkəzlər üçün",
    icon: <Star className="h-5 w-5" />,
    accent: "text-slate-700 bg-gradient-to-br from-slate-200 to-slate-100",
    features: [
      "Free-dəki hər şey +",
      "250 GB bulud storage",
      "15 şəkil",
      "Axtarışda prioritet sıralanma",
      "Limitsiz pasiyent müraciəti",
      "Əsas analitika (baxış · zəng · WhatsApp)",
      "WhatsApp düyməsi",
    ],
  },
  {
    name: "Gold",
    price: "59",
    period: "AZN / ay",
    tagline: "Ən çox seçilən — görünürlük + storage",
    icon: <Crown className="h-5 w-5" />,
    accent: "text-amber-700 bg-gradient-to-br from-amber-200 to-amber-100",
    popular: true,
    features: [
      "Silver-dəki hər şey +",
      "1 TB bulud storage",
      "«Tövsiyə olunan» nişanı + featured yerləşdirmə",
      "Tam analitika paneli",
      "Həkim-referral vurğusu",
      "40 şəkil",
      "Prioritet dəstək",
    ],
  },
  {
    name: "Platinum",
    price: "119",
    period: "AZN / ay",
    tagline: "Böyük mərkəzlər üçün maksimum",
    icon: <Gem className="h-5 w-5" />,
    accent: "text-cyan-700 bg-gradient-to-br from-cyan-200 to-cyan-100",
    features: [
      "Gold-dakı hər şey +",
      "3 TB bulud storage (+1 TB blok ~29 AZN)",
      "Şəhər / kateqoriya üzrə TOP #1 yerləşdirmə",
      "Limitsiz şəkil",
      "Brendinq (loqo · banner)",
      "Fayl export / API girişi",
      "Fərdi menecer + prioritet dəstək",
    ],
  },
];

const doctorTiers: Tier[] = [
  {
    name: "Free",
    price: "0",
    period: "AZN / ay",
    tagline: "Həkim profili və referral",
    icon: <Sparkles className="h-5 w-5" />,
    accent: "text-slate-600 bg-slate-100",
    features: [
      "Baza həkim profili",
      "Pasiyent referralı göndərmə",
      "20 GB storage (pasiyent görüntüləri)",
      "Mərkəzlərlə çat",
      "Standart sıralanma",
    ],
  },
  {
    name: "Silver",
    price: "15",
    period: "AZN / ay",
    tagline: "Profilini gücləndir",
    icon: <Star className="h-5 w-5" />,
    accent: "text-slate-700 bg-gradient-to-br from-slate-200 to-slate-100",
    features: [
      "Free-dəki hər şey +",
      "Təsdiqlənmiş nişan",
      "100 GB storage",
      "Portfolio (şəkillər)",
      "Profil statistikası",
      "Axtarışda prioritet",
    ],
  },
  {
    name: "Gold",
    price: "29",
    period: "AZN / ay",
    tagline: "Ən çox seçilən",
    icon: <Crown className="h-5 w-5" />,
    accent: "text-amber-700 bg-gradient-to-br from-amber-200 to-amber-100",
    popular: true,
    features: [
      "Silver-dəki hər şey +",
      "500 GB storage",
      "Həkimlər siyahısında üst sıra",
      "Instagram / vebsayt vurğusu",
      "Limitsiz referral tarixçəsi",
      "Prioritet dəstək",
    ],
  },
  {
    name: "Platinum",
    price: "49",
    period: "AZN / ay",
    tagline: "Maksimum görünürlük",
    icon: <Gem className="h-5 w-5" />,
    accent: "text-cyan-700 bg-gradient-to-br from-cyan-200 to-cyan-100",
    features: [
      "Gold-dakı hər şey +",
      "1 TB storage",
      "Axtarışda TOP yerləşmə",
      "Tam brendinq",
      "Fərdi dəstək",
    ],
  },
];

function TierCard({ tier }: { tier: Tier }) {
  return (
    <Card
      className={
        tier.popular
          ? "relative flex flex-col ring-2 ring-amber-400"
          : "relative flex flex-col"
      }
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge tone="amber">Ən populyar</Badge>
        </span>
      )}
      <div className="p-5 sm:p-6">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tier.accent}`}
        >
          {tier.icon}
        </span>
        <h3 className="mt-3 text-lg font-bold text-ink-900">{tier.name}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{tier.tagline}</p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-display text-4xl font-bold text-ink-900">{tier.price}</span>
          <span className="text-sm text-slate-500">{tier.period}</span>
        </div>
      </div>
      <div className="border-t border-slate-100 p-5 sm:p-6">
        <ul className="space-y-2.5">
          {tier.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default function PackagesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Daxili qaralama"
        title="İstifadə paketləri"
        description="Mərkəzlər və həkimlər üçün paket qiymətləri və imkanları. Bu səhifə hələ saytda görünmür — yalnız daxili baxış üçündür."
        breadcrumbs={[{ name: "Paketlər" }]}
      />

      <Section>
        <Container>
          <div className="mx-auto mb-10 flex max-w-3xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <strong>Qeyd:</strong> qiymətlər və imkanlar müzakirə mərhələsindədir (nümunə
              rəqəmlərdir). Ödəniş sistemi hələ aktiv deyil — Payriff müqaviləsi tamamlandıqdan
              sonra işə düşəcək. Əsas gəlir modeli: mərkəzlərə bulud storage satışı.
            </p>
          </div>

          {/* --------- Mərkəzlər üçün --------- */}
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-cyan-600" />
            <h2 className="font-display text-2xl font-bold text-ink-900">
              Rentgen mərkəzləri üçün
            </h2>
          </div>
          <p className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
            <HardDrive className="h-4 w-4" />
            Storage dolduqca +blok alına və ya köhnə fayllar silinə bilər.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {centerTiers.map((t) => (
              <TierCard key={t.name} tier={t} />
            ))}
          </div>

          {/* --------- Həkimlər üçün --------- */}
          <div className="mb-3 mt-16 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-cyan-600" />
            <h2 className="font-display text-2xl font-bold text-ink-900">Həkimlər üçün</h2>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            Həkim profili, referral alətləri və pasiyent görüntüləri üçün storage.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {doctorTiers.map((t) => (
              <TierCard key={t.name} tier={t} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
