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
