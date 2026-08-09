import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Info } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Card } from "@/components/ui/card";
import { WaSendRow } from "@/components/operator/wa-send-row";
import { WaSearch } from "@/components/operator/wa-search";
import { todaysBatch, sentToday, WA_DAILY_LIMIT } from "@/lib/price-invite";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "WhatsApp qiymət dəvətləri",
  path: "/admin/whatsapp",
  noIndex: true,
});

/**
 * Operator panelindəki (/panel/whatsapp) qiymət kampaniyasının admin görünüşü —
 * eyni növbə, eyni gündəlik limit, eyni jurnal (`center:wa_price_invite`).
 * Kim göndərirsə göndərsin, sayğac ORTAQDIR — admin + operator birlikdə
 * gündə WA_DAILY_LIMIT keçə bilməz. Bax `src/lib/price-invite.ts`.
 */
export default async function AdminWhatsappPage(props: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/whatsapp");
  const { q = "", tab } = await props.searchParams;
  const kind = tab === "faq" ? ("faq" as const) : ("price" as const);
  const [{ remaining, candidates }, used] = await Promise.all([todaysBatch(kind), sentToday()]);

  return (
    <AdminShell title="WhatsApp dəvətləri" userName={admin.phone}>
      {/* Kampaniya tabları — qiymət və FAQ dəvətləri (ortaq gündəlik limit) */}
      <div className="mb-4 flex gap-2">
        <Link
          href="/admin/whatsapp"
          className={
            kind === "price"
              ? "rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white"
              : "rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 hover:border-brand-300"
          }
        >
          💰 Qiymət dəvətləri
        </Link>
        <Link
          href="/admin/whatsapp?tab=faq"
          className={
            kind === "faq"
              ? "rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white"
              : "rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 hover:border-brand-300"
          }
        >
          ❓ FAQ dəvətləri
        </Link>
      </div>

      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-lg font-bold text-ink-900">
            Bu gün: <span className="text-brand-600">{used}</span> / {WA_DAILY_LIMIT} göndərilib
          </p>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
            qalıq: {remaining}
          </span>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Qayda:</strong> düymə WhatsApp-ı hazır mesajla açır — yalnız «göndər»ə
            basın, mətni dəyişməyin (hər mərkəzə fərqli variant düşür). Dalbadal yox,
            arada 2-3 dəqiqə fasilə ilə göndərin. Cavab yazana mütləq cavab verin —
            ikitərəfli söhbət nömrəni qoruyur. Limit operatorla ORTAQDIR: kim göndərsə,
            sayğac artır. Günlük limit dolanda sabah davam edin.
          </span>
        </div>
      </Card>

      <WaSearch q={q} basePath="/admin/whatsapp" kind={kind} extraParams={kind === "faq" ? { tab: "faq" } : {}} />

      {candidates.length > 0 ? (
        <div className="space-y-3">
          {candidates.map((c) => (
            <WaSendRow
              key={c.centerId}
              centerId={c.centerId}
              name={c.name}
              city={c.city}
              status={c.status}
              waPhone={c.waPhone}
              waUrl={c.waUrl}
              reviews={c.googleReviewCount}
              kind={kind}
            />
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-semibold text-ink-900">
            {remaining === 0 ? "Bugünkü limit doldu — sabah davam edin." : "Göndəriləcək mərkəz qalmayıb."}
          </p>
        </Card>
      )}
    </AdminShell>
  );
}
