import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { patientNav } from "@/components/dashboard/role-navs";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { ButtonLink } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/badge";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { FavoriteRemoveButton } from "@/components/favorite-remove-button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Seçilmiş mərkəzlər",
  path: "/kabinet/secilmisler",
  noIndex: true,
});

export default async function FavoritesPage() {
  const user = await requireRole("PATIENT", "/kabinet/secilmisler");
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: user.id },
    include: {
      favoriteCenters: {
        where: { status: "APPROVED" },
        orderBy: { name: "asc" },
      },
    },
  });

  const pd = getPanelDict(await getLocale());
  const t = pd.patient;
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || pd.shell.rolePatient;
  const favorites = profile?.favoriteCenters ?? [];

  return (
    <DashboardShell title={t.favoritesTitle} roleLabel={pd.shell.rolePatient} userName={name} nav={patientNav}>
      <Panel>
        {favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/rentgen-merkezleri/${c.slug}`}
                      className="font-semibold text-ink-900 hover:text-brand-600"
                    >
                      {c.name}
                    </Link>
                    <VerifiedBadge />
                  </div>
                  {c.city && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-brand-500" /> {c.city}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CallButton phone={c.phone} className="h-9 px-3 text-xs" />
                  {c.whatsapp && <WhatsAppButton phone={c.whatsapp} className="h-9 px-3 text-xs" />}
                  <FavoriteRemoveButton centerId={c.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart />}
            title={t.favEmptyTitle}
            description={t.favEmptyBody}
          >
            <ButtonLink href="/rentgen-merkezleri">
              <Search className="h-4 w-4" /> {t.findCenter}
            </ButtonLink>
          </EmptyState>
        )}
      </Panel>
    </DashboardShell>
  );
}
