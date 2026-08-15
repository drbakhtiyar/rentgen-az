import type { Metadata } from "next";
import Link from "next/link";
import {
  History,
  MessageCircle,
  Inbox,
  Star,
  Wallet,
  MessageSquare,
  Building2,
  UserCog,
  ClipboardCheck,
} from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel, EmptyState } from "@/components/dashboard/widgets";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { OPERATOR_NAME, OPERATOR_PHONE } from "@/lib/auth/operator";
import { bakuDayStart } from "@/lib/price-invite";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Jurnal",
  path: "/admin/jurnal",
  noIndex: true,
});

/* ------------------------------------------------------------------ *
 * Vahid sistem lenti (istifadəçi istəyi, 2026-08-10): yalnız admin
 * əməliyyatları yox — sorğular, rəylər, ödənişlər, SMS-lər, yeni
 * mərkəzlər və özünəxidmət qeydləri bir axında, detalları ilə.
 * ------------------------------------------------------------------ */

type EventKind =
  | "admin"      // admin/operator əməliyyatı
  | "whatsapp"   // WA dəvətləri
  | "ozun"       // mərkəzin linklə özünəxidməti
  | "sorgu"      // pasiyent sorğusu
  | "rey"        // yeni rəy
  | "odenis"     // ödəniş
  | "sms"        // sistem SMS-i (OTP istisna)
  | "merkez";    // yeni mərkəz

type Ev = {
  id: string;
  kind: EventKind;
  time: Date;
  title: string;
  /** Kim / hansı obyekt / əlavə detal — nöqtə ilə birləşdirilir. */
  parts: (string | null | undefined)[];
  href?: string;
};

const ACTION_LABELS: Record<string, string> = {
  "center:APPROVED": "Mərkəz təsdiqləndi",
  "center:DEACTIVATED": "Mərkəz deaktiv edildi",
  "center:PENDING": "Mərkəz gözləməyə qaytarıldı",
  "center:create": "Mərkəz yaradıldı",
  "center:edit": "Mərkəz redaktə edildi",
  "center:delete": "Mərkəz silindi",
  "user:block": "İstifadəçi bloklandı",
  "user:unblock": "İstifadəçi bloku götürüldü",
  "blog:create": "Məqalə yaradıldı",
  "blog:update": "Məqalə yeniləndi",
  "blog:delete": "Məqalə silindi",
  "center:wa_price_invite": "WhatsApp qiymət dəvəti",
  "center:wa_faq_invite": "WhatsApp FAQ dəvəti",
  "center:wa_card_invite": "WhatsApp kart dəvəti",
  "center:wa_cabinet_invite": "WhatsApp kabinet dəvəti",
  "center:price_self": "Mərkəz qiymətlərini yazdı",
  "center:faq_self": "Mərkəz FAQ cavablarını yazdı",
  "center:card_self": "Mərkəz kartını yenilədi",
  // Girişsiz link izləməsi (2026-08-14): kim açdı — aşağıdakı "parts" mərkəz
  // adını göstərir, nişan isə "Özünəxidmət" olur.
  "center:link_visit_q": "Mərkəz qiymət linkini açdı",
  "center:link_visit_f": "Mərkəz FAQ linkini açdı",
  "center:link_visit_m": "Mərkəz kart linkini açdı",
  "center:wa_weekly_stats": "Həftəlik statistika hesabatı",
  "api:accounts_used": "Mobil API: accounts çağırıldı",
};

const SMS_KIND_LABELS: Record<string, string> = {
  center_request: "sorğu bildirişi",
  patient_status: "status bildirişi",
  reminder: "xatırlatma",
  review_invite: "rəy dəvəti",
  campaign: "kampaniya",
  other: "digər",
};

/** Admin hesabı placeholder nömrə ilə yaradılıb (ADMIN_PHONE env yox idi;
 *  real nömrə pasiyent hesabı ilə toqquşardı) — jurnalda ad göstəririk. */
const ADMIN_PLACEHOLDER_PHONE = "+994500000000";

function actorLabel(phone: string | null | undefined): string | null {
  if (!phone) return null;
  if (phone === OPERATOR_PHONE) return `${OPERATOR_NAME} (operator)`;
  if (phone === ADMIN_PLACEHOLDER_PHONE) return "Administrator";
  return phone;
}

/** AdminActionLog.meta → oxunaqlı detal sətri. */
function metaDetail(action: string, meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  if (action === "center:card_self") {
    const removed = Array.isArray(m.removed) ? (m.removed as string[]) : [];
    const bits = [
      removed.length
        ? `silindi: ${removed.slice(0, 4).join(", ")}${removed.length > 4 ? ` +${removed.length - 4}` : ""}`
        : null,
      typeof m.added === "number" && m.added > 0 ? `əlavə: ${m.added}` : null,
      typeof m.priced === "number" && m.priced > 0 ? `qiymət: ${m.priced}` : null,
      m.hours === true ? "iş saatları ✓" : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" · ") : null;
  }
  if (action === "center:price_self") {
    const bits = [
      typeof m.count === "number" ? `${m.count} qiymət` : null,
      typeof m.added === "number" && m.added > 0 ? `${m.added} yeni xidmət` : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" · ") : null;
  }
  if (action === "center:faq_self" && typeof m.count === "number")
    return `${m.count} cavab`;
  return null;
}

const KIND_STYLE: Record<EventKind, { label: string; icon: React.ReactNode; cls: string }> = {
  admin:    { label: "Admin",       icon: <UserCog className="h-3.5 w-3.5" />,        cls: "bg-slate-100 text-slate-700 ring-slate-200" },
  whatsapp: { label: "WhatsApp",    icon: <MessageCircle className="h-3.5 w-3.5" />,  cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  ozun:     { label: "Özünəxidmət", icon: <ClipboardCheck className="h-3.5 w-3.5" />, cls: "bg-brand-50 text-brand-700 ring-brand-200" },
  sorgu:    { label: "Sorğu",       icon: <Inbox className="h-3.5 w-3.5" />,          cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  rey:      { label: "Rəy",         icon: <Star className="h-3.5 w-3.5" />,           cls: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
  odenis:   { label: "Ödəniş",      icon: <Wallet className="h-3.5 w-3.5" />,         cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  sms:      { label: "SMS",         icon: <MessageSquare className="h-3.5 w-3.5" />,  cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  merkez:   { label: "Yeni mərkəz", icon: <Building2 className="h-3.5 w-3.5" />,      cls: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
};

const TABS: { key: string; label: string; kinds: EventKind[] }[] = [
  { key: "hamisi",   label: "Hamısı",         kinds: ["admin", "whatsapp", "ozun", "sorgu", "rey", "odenis", "sms", "merkez"] },
  { key: "whatsapp", label: "💬 WhatsApp",     kinds: ["whatsapp"] },
  { key: "ozun",     label: "📝 Özünəxidmət",  kinds: ["ozun"] },
  { key: "sorgu",    label: "📥 Sorğular",     kinds: ["sorgu"] },
  { key: "rey",      label: "⭐ Rəylər",        kinds: ["rey"] },
  { key: "odenis",   label: "💳 Ödənişlər",    kinds: ["odenis"] },
  { key: "sms",      label: "✉️ SMS",           kinds: ["sms"] },
  { key: "admin",    label: "🛠 Admin",         kinds: ["admin", "merkez"] },
];

async function collectEvents(): Promise<Ev[]> {
  const TAKE = 80;
  const [logs, requests, reviews, payments, sms, newCenters] = await Promise.all([
    prisma.adminActionLog
      .findMany({
        include: { admin: { select: { phone: true } } },
        orderBy: { createdAt: "desc" },
        take: TAKE,
      })
      .catch(() => []),
    prisma.appointmentRequest
      .findMany({
        select: {
          id: true, name: true, serviceSlug: true, status: true, createdAt: true,
          center: { select: { name: true } }, doctor: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: TAKE,
      })
      .catch(() => []),
    prisma.review
      .findMany({
        select: {
          id: true, rating: true, comment: true, source: true, createdAt: true,
          center: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      })
      .catch(() => []),
    prisma.payment
      .findMany({
        select: { id: true, amount: true, status: true, purpose: true, createdAt: true, user: { select: { phone: true } } },
        orderBy: { createdAt: "desc" },
        take: 40,
      })
      .catch(() => []),
    prisma.smsLog
      .findMany({
        where: { kind: { not: "otp" } }, // OTP axını lenti boğur — sayı stat kartındadır
        select: { id: true, phone: true, kind: true, ok: true, provider: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 60,
      })
      .catch(() => []),
    prisma.centerProfile
      .findMany({
        select: { id: true, name: true, status: true, city: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
      .catch(() => []),
  ]);

  // Admin-log hədəflərinin adları
  const centerIds = [
    ...new Set(
      logs.filter((l) => l.targetType === "CenterProfile" && l.targetId).map((l) => l.targetId as string),
    ),
  ];
  const centers = centerIds.length
    ? await prisma.centerProfile
        .findMany({ where: { id: { in: centerIds } }, select: { id: true, name: true, slug: true } })
        .catch(() => [])
    : [];
  const centerById = new Map(centers.map((c) => [c.id, c]));

  const evs: Ev[] = [];

  for (const l of logs) {
    // Mərkəzin ÖZ hərəkətləri (forma yazması və link açması) "Özünəxidmət"
    // nişanı alır — operatorun etdiyi əməliyyatlardan ayrılsın (2026-08-15).
    const kind: EventKind = l.action.startsWith("center:wa_")
      ? "whatsapp"
      : l.action.endsWith("_self") || l.action.startsWith("center:link_visit_")
        ? "ozun"
        : "admin";
    const c = l.targetId ? centerById.get(l.targetId) : undefined;
    evs.push({
      id: `log-${l.id}`,
      kind,
      time: l.createdAt,
      title: ACTION_LABELS[l.action] ?? l.action,
      parts: [
        kind === "ozun" ? null : actorLabel(l.admin?.phone),
        c?.name ?? (l.targetType === "CenterProfile" ? null : l.targetType),
        metaDetail(l.action, l.meta),
      ],
      href: c ? `/admin/merkezler/${l.targetId}` : undefined,
    });
  }

  for (const r of requests) {
    evs.push({
      id: `req-${r.id}`,
      kind: "sorgu",
      time: r.createdAt,
      title: "Yeni müayinə sorğusu",
      parts: [
        r.name,
        r.serviceSlug ?? null,
        r.center?.name ?? ([r.doctor?.firstName, r.doctor?.lastName].filter(Boolean).join(" ") || null),
        `status: ${r.status}`,
      ],
      href: "/admin/muracietler",
    });
  }

  for (const r of reviews) {
    evs.push({
      id: `rev-${r.id}`,
      kind: "rey",
      time: r.createdAt,
      title: `Yeni rəy — ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}`,
      parts: [
        r.center?.name,
        r.source === "invite" ? "SMS dəvəti ilə" : r.source,
        r.comment ? `"${r.comment.slice(0, 60)}${r.comment.length > 60 ? "…" : ""}"` : null,
      ],
      href: "/admin/reyler",
    });
  }

  for (const pm of payments) {
    evs.push({
      id: `pay-${pm.id}`,
      kind: "odenis",
      time: pm.createdAt,
      title: `Ödəniş — ${(pm.amount / 100).toFixed(2)} ₼`,
      parts: [pm.user?.phone ?? null, pm.purpose, pm.status],
      href: "/admin/odenisler",
    });
  }

  for (const m of sms) {
    evs.push({
      id: `sms-${m.id}`,
      kind: "sms",
      time: m.createdAt,
      title: `SMS — ${SMS_KIND_LABELS[m.kind] ?? m.kind}`,
      parts: [m.phone, m.provider, m.ok ? "göndərildi ✓" : "XƏTA"],
    });
  }

  for (const c of newCenters) {
    evs.push({
      id: `ctr-${c.id}`,
      kind: "merkez",
      time: c.createdAt,
      title: "Yeni mərkəz yaradıldı",
      parts: [c.name, c.city, c.status],
      href: `/admin/merkezler/${c.id}`,
    });
  }

  return evs.sort((a, b) => b.time.getTime() - a.time.getTime());
}

/** Bugünkü (Bakı günü) say kartları. */
async function todayStats() {
  const since = bakuDayStart();
  const [sorgu, rey, wa, ozun, smsAll, otp, odenis] = await Promise.all([
    prisma.appointmentRequest.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.review.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.adminActionLog
      .count({ where: { action: { startsWith: "center:wa_" }, createdAt: { gte: since } } })
      .catch(() => 0),
    prisma.adminActionLog
      .count({ where: { action: { endsWith: "_self" }, createdAt: { gte: since } } })
      .catch(() => 0),
    prisma.smsLog.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.smsLog.count({ where: { kind: "otp", createdAt: { gte: since } } }).catch(() => 0),
    prisma.payment
      .aggregate({ _sum: { amount: true }, where: { status: "PAID", createdAt: { gte: since } } })
      .then((r) => (r._sum.amount ?? 0) / 100)
      .catch(() => 0),
  ]);
  return { sorgu, rey, wa, ozun, smsAll, otp, odenis };
}

export default async function AdminJurnalPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/jurnal");
  const { tab = "hamisi" } = await props.searchParams;
  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  const [events, stats] = await Promise.all([collectEvents(), todayStats()]);
  const shown = events.filter((e) => activeTab.kinds.includes(e.kind)).slice(0, 120);

  const statCards = [
    { label: "Sorğu", value: stats.sorgu },
    { label: "Rəy", value: stats.rey },
    { label: "WA dəvəti", value: stats.wa },
    { label: "Özünəxidmət", value: stats.ozun },
    { label: "SMS (OTP daxil)", value: `${stats.smsAll} (${stats.otp})` },
    { label: "Ödəniş", value: `${stats.odenis.toFixed(0)} ₼` },
  ];

  return (
    <AdminShell title="Jurnal" userName={admin.phone}>
      {/* Bugünkü mənzərə */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.label} className="p-3.5 text-center">
            <p className="font-display text-xl font-bold text-ink-900">{s.value}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">bu gün · {s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filtr tabları */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "hamisi" ? "/admin/jurnal" : `/admin/jurnal?tab=${t.key}`}
            className={
              activeTab.key === t.key
                ? "rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white"
                : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-600 hover:border-brand-300"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Panel title="Sistem lenti">
        {shown.length > 0 ? (
          <div className="space-y-2.5">
            {shown.map((e) => {
              const st = KIND_STYLE[e.kind];
              const body = (
                <>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.cls}`}
                  >
                    {st.icon}
                    {st.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink-900">{e.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-slate-500">
                      {e.parts.filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                    {formatDateAz(e.time)}
                  </span>
                </>
              );
              const cls =
                "flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3.5 text-left";
              return e.href ? (
                <Link key={e.id} href={e.href} className={`${cls} hover:border-brand-200 hover:bg-brand-50/30`}>
                  {body}
                </Link>
              ) : (
                <div key={e.id} className={cls}>
                  {body}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<History />}
            title="Bu filtrdə qeyd yoxdur"
            description="Sistem hadisələri (sorğu, rəy, ödəniş, SMS, WhatsApp, özünəxidmət) burada görünəcək."
          />
        )}
      </Panel>
    </AdminShell>
  );
}
