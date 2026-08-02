import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";
import { OperatorShell } from "@/components/operator/operator-shell";
import { CenterProfileForm } from "@/components/forms/center-profile-form";
import { updateCenterFlexAction } from "@/app/panel/actions";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { prisma } from "@/lib/db";
import { parseHours } from "@/lib/hours";
import { parseFaqAnswers } from "@/content/center-faq";
import { CITIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəzi redaktə et",
  path: "/panel",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function OperatorEditCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  const { id } = await params;

  const center = await prisma.centerProfile.findUnique({ where: { id } });
  if (!center) notFound();

  const userName = user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator";
  const save = updateCenterFlexAction.bind(null, center.id);

  return (
    <OperatorShell title={center.name} userName={userName}>
      <Link
        href="/panel"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Mərkəzlərə qayıt
      </Link>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">

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
          maxImages={999}
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
      </div>
    </OperatorShell>
  );
}
