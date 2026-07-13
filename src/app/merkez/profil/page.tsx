import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { CenterProfileForm } from "@/components/forms/center-profile-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { CITIES } from "@/lib/constants";
import { parseHours } from "@/lib/hours";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";
import { centerLimits } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəz profili",
  path: "/merkez/profil",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function CenterProfilePage() {
  const user = await requireRole("CENTER", "/merkez/profil");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!center) redirect("/merkez/qeydiyyat");
  const pd = getPanelDict(await getLocale());

  return (
    <DashboardShell title={pd.nav.profil} roleLabel={pd.center.roleLabel} userName={center.name} nav={centerNav}>
      <CenterProfileForm
        cities={cityOptions}
        mode="edit"
        maxImages={centerLimits(center.plan).photoLimit ?? 999}
        allowBanner={centerLimits(center.plan).banner}
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
          licenseUrl: center.licenseUrl,
          bannerUrl: center.bannerUrl,
          images: center.images,
          hours: parseHours(center.hours),
          lat: center.lat,
          lng: center.lng,
        }}
      />
    </DashboardShell>
  );
}
