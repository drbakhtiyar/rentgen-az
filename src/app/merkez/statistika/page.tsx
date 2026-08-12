import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  Globe,
  AtSign,
  Phone,
  MessageCircle,
  Navigation,
  FileCheck,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getCenterEngagement } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Statistika",
  path: "/merkez/statistika",
  noIndex: true,
});

/* Mərkəz engagement statistikası (Faza 2, 2026-08-13). HƏLƏLİK bütün
 * planlara açıqdır — sonradan detallar Silver+ qapısına bağlanacaq
 * (istifadəçi qərarı; bax memory: rentgen-az-statistika). */

const METRICS: { key: string; label: string; icon: React.ReactNode; hint: string }[] = [
  { key: "view", label: "Profil baxışı", icon: <Eye />, hint: "Səhifənizə giriş sayı" },
  { key: "call", label: "Zəng kliki", icon: <Phone />, hint: "«Zəng et» düyməsi" },
  { key: "whatsapp", label: "WhatsApp kliki", icon: <MessageCircle />, hint: "«WhatsApp» düyməsi" },
  { key: "directions", label: "Yol tarifi", icon: <Navigation />, hint: "Xəritə / istiqamət" },
  { key: "license", label: "Lisenziya baxışı", icon: <FileCheck />, hint: "Sənədin böyüdülməsi" },
  { key: "faq", label: "FAQ oxunuşu", icon: <HelpCircle />, hint: "Sual-cavab açılışı" },
  { key: "website", label: "Sayt kliki", icon: <Globe />, hint: "Veb sayt linki" },
  { key: "instagram", label: "Instagram kliki", icon: <AtSign />, hint: "Instagram linki" },
];

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0 && cur === 0)
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
        <Minus className="h-3.5 w-3.5" /> —
      </span>
    );
  if (prev === 0)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <TrendingUp className="h-3.5 w-3.5" /> yeni
      </span>
    );
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0)
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
        <Minus className="h-3.5 w-3.5" /> 0%
      </span>
    );
  return pct > 0 ? (
    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
      <TrendingUp className="h-3.5 w-3.5" /> +{pct}%
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
      <TrendingDown className="h-3.5 w-3.5" /> {pct}%
    </span>
  );
}

/** Kitabxanasız günlük baxış qrafiki (SVG barlar). */
function DailyChart({ daily }: { daily: { date: string; views: number }[] }) {
  if (daily.length === 0) return null;
  const max = Math.max(1, ...daily.map((d) => d.views));
  const W = 720;
  const H = 120;
  const gap = 3;
  const bw = Math.max(4, Math.floor((W - gap * (daily.length - 1)) / daily.length));
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-4 w-full" aria-hidden>
      {daily.map((d, i) => {
        const h = Math.max(2, Math.round((d.views / max) * H));
        const x = i * (bw + gap);
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={H - h}
              width={bw}
              height={h}
              rx={2}
              className={d.views > 0 ? "fill-brand-500" : "fill-slate-200"}
            >
              <title>{`${d.date}: ${d.views} baxış`}</title>
            </rect>
          </g>
        );
      })}
      <text x={0} y={H + 14} className="fill-slate-400 text-[10px]">
        {daily[0]?.date.slice(5)}
      </text>
      <text x={W} y={H + 14} textAnchor="end" className="fill-slate-400 text-[10px]">
        {daily[daily.length - 1]?.date.slice(5)}
      </text>
    </svg>
  );
}

export default async function CenterStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const user = await requireRole("CENTER", "/merkez/statistika");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  if (!center) return null;

  const sp = await searchParams;
  const days = sp.d === "30" ? 30 : 7;
  const { current, previous, daily } = await getCenterEngagement(center.id, days);

  const total = METRICS.reduce((n, m) => n + (current[m.key] ?? 0), 0);
  const contacts = (current.call ?? 0) + (current.whatsapp ?? 0);

  const tab = (d: number, label: string) => (
    <Link
      href={d === 7 ? "/merkez/statistika" : `/merkez/statistika?d=${d}`}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition-colors ${
        days === d
          ? "bg-brand-600 text-white ring-brand-600"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <DashboardShell title="Statistika" roleLabel="Mərkəz" userName={center.name} nav={centerNav}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Son {days} gündə profiliniz ümumilikdə{" "}
          <span className="font-semibold text-ink-900">{current.view ?? 0} dəfə baxılıb</span>
          {contacts > 0 && (
            <>
              {" "}
              və <span className="font-semibold text-ink-900">{contacts} əlaqə</span> alıb
            </>
          )}
          .
        </p>
        <div className="flex gap-2">
          {tab(7, "Son 7 gün")}
          {tab(30, "Son 30 gün")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {METRICS.map((m) => {
          const cur = current[m.key] ?? 0;
          const prev = previous[m.key] ?? 0;
          return (
            <Card key={m.key} className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 [&>svg]:h-5 [&>svg]:w-5">
                  {m.icon}
                </span>
                <Delta cur={cur} prev={prev} />
              </div>
              <div className="font-display mt-3 text-3xl font-bold text-ink-900">{cur}</div>
              <div className="mt-0.5 text-sm font-medium text-ink-800">{m.label}</div>
              <div className="text-xs text-slate-400">{m.hint}</div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5 p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-ink-900">
          Günlük profil baxışları
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Müqayisə əvvəlki {days} günlə aparılır. Say hər bir ziyarətçi sessiyasında bir dəfə qeyd olunur.
        </p>
        <DailyChart daily={daily} />
      </Card>

      {total === 0 && (
        <Card className="mt-5 p-6 text-center text-sm text-slate-600">
          Bu dövrdə hələ aktivlik qeydə alınmayıb. Profilinizi dolğunlaşdırın —
          qiymətlər, iş saatları və foto olan mərkəzlər axtarışda daha çox seçilir.
        </Card>
      )}
    </DashboardShell>
  );
}
