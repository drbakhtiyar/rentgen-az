import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Info } from "lucide-react";
import { OperatorShell } from "@/components/operator/operator-shell";
import { Card } from "@/components/ui/card";
import { WaSendRow } from "@/components/operator/wa-send-row";
import { todaysBatch, sentToday, WA_DAILY_LIMIT } from "@/lib/price-invite";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "WhatsApp qiymət dəvətləri",
  path: "/panel",
  noIndex: true,
});

/**
 * Operator üçün günlük WhatsApp növbəsi (qiymət toplama kampaniyası).
 * Gündə maksimum WA_DAILY_LIMIT göndəriş — limit alətə tikilib ki, WhatsApp
 * spam siqnalı yaranmasın. Bax `src/lib/price-invite.ts`.
 */
export default async function OperatorWhatsappPage() {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  const [{ remaining, candidates }, used] = await Promise.all([todaysBatch(), sentToday()]);

  return (
    <OperatorShell
      title="WhatsApp qiymət dəvətləri"
      userName={user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator"}
    >
      <Link
        href="/panel"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Mərkəzlərə qayıt
      </Link>

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
            ikitərəfli söhbət nömrəni qoruyur. Günlük limit dolanda sabah davam edin.
          </span>
        </div>
      </Card>

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
    </OperatorShell>
  );
}
