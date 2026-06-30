import type { Metadata } from "next";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel, EmptyState } from "@/components/dashboard/widgets";
import { ServiceIcon } from "@/components/ui/service-icon";
import { ActiveToggle, SeoSettingForm } from "@/components/admin/settings-controls";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Parametrlər",
  path: "/admin/parametrler",
  noIndex: true,
});

export default async function AdminSettingsPage() {
  const admin = await requireRole("ADMIN", "/admin/parametrler");

  let services: Awaited<ReturnType<typeof prisma.service.findMany>> = [];
  let cities: Awaited<ReturnType<typeof prisma.city.findMany>> = [];
  let seo: Awaited<ReturnType<typeof prisma.seoSetting.findMany>> = [];
  try {
    [services, cities, seo] = await Promise.all([
      prisma.service.findMany({ orderBy: { order: "asc" } }),
      prisma.city.findMany({ orderBy: { order: "asc" } }),
      prisma.seoSetting.findMany({ orderBy: { path: "asc" } }),
    ]);
  } catch {
    /* keep empties */
  }

  return (
    <AdminShell title="Parametrlər" userName={admin.phone}>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={`Xidmətlər (${services.length})`}>
          {services.length > 0 ? (
            <div className="space-y-2">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <ServiceIcon name={s.icon} className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-ink-900">{s.name}</span>
                  </span>
                  <ActiveToggle id={s.id} kind="service" active={s.isActive} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Xidmət kataloqu boşdur" description="Seed skriptini işə salın." />
          )}
        </Panel>

        <Panel title={`Şəhərlər / rayonlar (${cities.length})`}>
          {cities.length > 0 ? (
            <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {cities.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <span className="text-sm font-medium text-ink-900">{c.name}</span>
                  <ActiveToggle id={c.id} kind="city" active={c.isActive} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Şəhər siyahısı boşdur" description="Seed skriptini işə salın." />
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="SEO metadata (path üzrə)">
          <SeoSettingForm />
        </Panel>
        <Panel title={`Mövcud SEO qeydləri (${seo.length})`}>
          {seo.length > 0 ? (
            <div className="space-y-2">
              {seo.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-sm font-semibold text-ink-900">{s.path}</p>
                  {s.title && <p className="text-sm text-slate-600">{s.title}</p>}
                  {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Hələ xüsusi SEO qeydi yoxdur.</p>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
