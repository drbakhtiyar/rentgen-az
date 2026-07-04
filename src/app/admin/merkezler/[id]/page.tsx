import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel } from "@/components/dashboard/widgets";
import { CenterProfileForm } from "@/components/forms/center-profile-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { adminUpdateCenterAction } from "@/app/admin/actions";
import { CITIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

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

  return (
    <AdminShell title="Mərkəzi redaktə et" userName={admin.phone}>
      <Link
        href="/admin/merkezler"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Mərkəzlərə qayıt
      </Link>

      <Panel title={center.name}>
        <CenterProfileForm
          cities={cityOptions}
          mode="edit"
          onSave={save}
          defaults={{
            name: center.name,
            phone: center.phone,
            whatsapp: center.whatsapp ?? "",
            address: center.address ?? "",
            city: center.city ?? "",
            district: center.district ?? "",
            mapsUrl: center.mapsUrl ?? "",
            workingHours: center.workingHours ?? "",
            equipment: center.equipment ?? "",
            responsiblePerson: center.responsiblePerson ?? "",
            description: center.description ?? "",
            logoUrl: center.logoUrl,
            lat: center.lat,
            lng: center.lng,
          }}
        />
      </Panel>
    </AdminShell>
  );
}
