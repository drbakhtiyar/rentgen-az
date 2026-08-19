import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel } from "@/components/dashboard/widgets";
import { CenterProfileForm } from "@/components/forms/center-profile-form";
import { AdminMessageForm } from "@/components/admin/admin-message-form";
import { PlanSelector } from "@/components/admin/plan-selector";
import { WalletCredit } from "@/components/admin/wallet-credit";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import {
  adminUpdateCenterAction,
  adminSetCenterPlanAction,
  adminCreditWalletAction,
} from "@/app/admin/actions";
import { parseHours } from "@/lib/hours";
import { parseFaqAnswers } from "@/content/center-faq";
import { CITIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { centerLimits } from "@/lib/plans";
import { getCenterEngagement } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəzi redaktə et",
  path: "/admin/merkezler",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function AdminEditCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/merkezler");
  const { id } = await params;

  const center = await prisma.centerProfile.findUnique({ where: { id } });
  if (!center) notFound();

  // Engagement statistikası (Faza 3, 2026-08-13): son 30 gün + əvvəlki dövr
  const eng = await getCenterEngagement(center.id, 30);
  const STAT_ROWS: { key: string; label: string }[] = [
    { key: "view", label: "Baxış" },
    { key: "call", label: "Zəng" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "directions", label: "Yol tarifi" },
    { key: "license", label: "Lisenziya" },
    { key: "faq", label: "FAQ" },
    { key: "website", label: "Sayt" },
    { key: "instagram", label: "Instagram" },
  ];

  const save = adminUpdateCenterAction.bind(null, center.id);
  const setPlan = adminSetCenterPlanAction.bind(null, center.id);
  const credit = adminCreditWalletAction.bind(null, center.userId);

  return (
    <AdminShell title="Mərkəzi redaktə et" userName={admin.phone}>
      <Link
        href="/admin/merkezler"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Mərkəzlərə qayıt
      </Link>

      {/* Son 30 günün engagement zolağı */}
      <div className="mb-5 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {STAT_ROWS.map((r) => {
          const cur = eng.current[r.key] ?? 0;
          const prev = eng.previous[r.key] ?? 0;
          const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
          return (
            <div key={r.key} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center">
              <div className="font-display text-xl font-bold text-ink-900">{cur}</div>
              <div className="text-[11px] font-medium text-slate-500">{r.label} · 30g</div>
              {pct !== null && pct !== 0 && (
                <div className={`text-[11px] font-semibold ${pct > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Panel title={center.name}>

      <Link
        href={`/panel/${center.id}/xidmetler`}
        className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-5 py-4 transition hover:border-brand-400 hover:bg-brand-50"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 ring-1 ring-brand-100">
            <ListChecks className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink-900">Xidmətlər və qiymətlər</span>
            <span className="block text-xs text-slate-600">
              Xidmət əlavə et / sil və qiymət təyin et
            </span>
          </span>
        </span>
        <span className="text-sm font-semibold text-brand-600">Aç →</span>
      </Link>

        <CenterProfileForm
          cities={cityOptions}
          mode="edit"
          loose
          superEditable
          onSave={save}
          maxImages={centerLimits(center.plan).photoLimit ?? 999}
          allowBanner={centerLimits(center.plan).banner}
          defaults={{
            name: center.name,
            phone: center.phone,
            whatsapp: center.whatsapp ?? "",
            landlinePhone: center.landlinePhone ?? "",
            address: center.address ?? "",
            city: center.city ?? "",
            district: center.district ?? "",
            mapsUrl: center.mapsUrl ?? "",
            website: center.website ?? "",
            instagram: center.instagram ?? "",
            email: center.email ?? "",
            adminPhone: center.adminPhone ?? "",
            adminName: center.adminName ?? "",
            superAdminPhone: center.superAdminPhone ?? "",
            superAdminName: center.superAdminName ?? "",
            workingHours: center.workingHours ?? "",
            equipment: center.equipment ?? "",
            responsiblePerson: center.responsiblePerson ?? "",
            description: center.description ?? "",
            logoUrl: center.logoUrl,
            licenseUrl: center.licenseUrl,
            bannerUrl: center.bannerUrl,
            images: center.images,
            hours: parseHours(center.hours),
            lat: center.lat,
            lng: center.lng,
            faqAnswers: parseFaqAnswers(center.faqAnswers),
          }}
        />
      </Panel>

      <div className="mt-5">
        <Panel title="Paket / Abunə">
          <PlanSelector current={center.plan} action={setPlan} />
          <WalletCredit action={credit} />
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title="Mərkəzə bildiriş göndər">
          <AdminMessageForm userId={center.userId} />
        </Panel>
      </div>
    </AdminShell>
  );
}
