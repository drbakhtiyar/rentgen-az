import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { OperatorShell } from "@/components/operator/operator-shell";
import { Card } from "@/components/ui/card";
import { CenterServicesManager, type ServiceRow } from "@/components/forms/center-services-manager";
import { saveCenterServicesFlexAction } from "@/app/panel/actions";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Xidmətlər və qiymətlər",
  path: "/panel",
  noIndex: true,
});

/**
 * Operator/admin üçün mərkəzin XİDMƏT və QİYMƏT redaktəsi.
 *
 * Əvvəl bu yalnız mərkəzin öz panelində (`/merkez/xidmetler`) mümkün idi və
 * action sessiyadakı mərkəzə bağlı idi — yəni operator başqa mərkəzin
 * xidmətlərini nə əlavə, nə silə, nə də qiymətləndirə bilirdi. Halbuki
 * mərkəzlərin cəmi 3-ü panelə girib; məlumatı praktiki olaraq operator toplayır.
 */
export default async function OperatorCenterServicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  const { id } = await params;

  const center = await prisma.centerProfile.findUnique({
    where: { id },
    select: { id: true, name: true, city: true, slug: true, services: true },
  });
  if (!center) notFound();

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
      iconUrl: s.iconUrl,
      category: s.category,
      enabled: Boolean(cs),
      price: cs?.price ?? null,
      priceTo: cs?.priceTo ?? null,
      durationMin: cs?.durationMin ?? 30,
      note: cs?.note ?? "",
    };
  });

  const categories = [
    ...new Set(allServices.map((s) => s.category).filter((c): c is string => Boolean(c))),
  ];
  const categoryLabels: Record<string, string> = {};
  for (const c of categories) categoryLabels[c] = c;

  const save = saveCenterServicesFlexAction.bind(null, center.id);
  const enabledCount = center.services.length;
  const pricedCount = center.services.filter((s) => s.price != null).length;

  return (
    <OperatorShell
      title="Xidmətlər və qiymətlər"
      userName={user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator"}
    >
      <Link
        href={`/panel/${center.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> {center.name}
      </Link>

      <Card className="mb-5 p-5">
        <p className="font-display text-lg font-bold text-ink-900">
          {center.name}
          {center.city ? <span className="font-normal text-slate-400"> · {center.city}</span> : null}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Seçilmiş xidmət: <span className="font-semibold text-ink-900">{enabledCount}</span>
          {" · "}qiyməti olan: <span className="font-semibold text-ink-900">{pricedCount}</span>
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Xidməti seçmək üçün üzərinə toxunun, qiyməti isə manatla yazın. Qiymət
            <strong> məcburi deyil</strong> — əvvəlcə siyahını dəqiqləşdirib, qiyməti
            sonra (zəngdə) əlavə edə bilərsiniz. Mərkəzin özü panelə girəndə qiymət tələb olunur.
          </span>
        </div>
      </Card>

      <CenterServicesManager
        initial={rows}
        categories={categories}
        categoryLabels={categoryLabels}
        onSave={save}
        requirePrice={false}
      />
    </OperatorShell>
  );
}
