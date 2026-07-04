import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { CenterProfileForm } from "@/components/forms/center-profile-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { CITIES } from "@/lib/constants";
import { parseHours } from "@/lib/hours";
import { buildMetadata } from "@/lib/seo";

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

  return (
    <DashboardShell title="Profil" roleLabel="Rentgen mərkəzi" userName={center.name} nav={centerNav}>
      <CenterProfileForm
        cities={cityOptions}
        mode="edit"
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
          hours: parseHours(center.hours),
          lat: center.lat,
          lng: center.lng,
        }}
      />
    </DashboardShell>
  );
}
