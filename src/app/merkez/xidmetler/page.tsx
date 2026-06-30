import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { EmptyState } from "@/components/dashboard/widgets";
import { Card } from "@/components/ui/card";
import { CenterServicesManager, type ServiceRow } from "@/components/forms/center-services-manager";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Xidmətlər və qiymətlər",
  path: "/merkez/xidmetler",
  noIndex: true,
});

export default async function CenterServicesPage() {
  const user = await requireRole("CENTER", "/merkez/xidmetler");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    include: { services: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const allServices = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const byService = new Map(center.services.map((cs) => [cs.serviceId, cs]));
  const rows: ServiceRow[] = allServices.map((s) => {
    const cs = byService.get(s.id);
    return {
      serviceId: s.id,
      slug: s.slug,
      name: s.name,
      icon: s.icon,
      enabled: Boolean(cs),
      price: cs?.price ?? null,
      priceTo: cs?.priceTo ?? null,
      note: cs?.note ?? "",
    };
  });

  return (
    <DashboardShell
      title="Xidmətlər və qiymətlər"
      roleLabel="Rentgen mərkəzi"
      userName={center.name}
      nav={centerNav}
    >
      <Card className="mb-5 p-5">
        <p className="text-sm text-slate-600">
          Mərkəzinizin göstərdiyi xidmətləri seçin və qiymətləri əlavə edin. Qiymət
          aralığı üçün “yuxarı hədd” sahəsindən istifadə edin. Qiymət boş qalsa,
          profildə “Qiymət üçün soruşun” göstəriləcək.
        </p>
      </Card>

      {rows.length > 0 ? (
        <CenterServicesManager initial={rows} />
      ) : (
        <EmptyState
          title="Xidmət kataloqu boşdur"
          description="Sistemdə xidmətlər hələ əlavə olunmayıb. Zəhmət olmasa adminlə əlaqə saxlayın (seed/migrasiya tələb oluna bilər)."
        />
      )}
    </DashboardShell>
  );
}
