import type { Metadata } from "next";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel } from "@/components/dashboard/widgets";
import { ServiceManager } from "@/components/admin/service-manager";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Xidmətlər",
  path: "/admin/xidmetler",
  noIndex: true,
});

export default async function AdminServicesPage() {
  const admin = await requireRole("ADMIN", "/admin/xidmetler");

  let services: Awaited<ReturnType<typeof prisma.service.findMany>> = [];
  try {
    services = await prisma.service.findMany({ orderBy: { order: "asc" } });
  } catch {
    /* keep empty */
  }

  return (
    <AdminShell title="Xidmətlər" userName={admin.phone}>
      <Panel title={`Xidmət kataloqu (${services.length})`}>
        <ServiceManager services={services} />
      </Panel>
    </AdminShell>
  );
}
