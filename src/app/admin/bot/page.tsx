import type { Metadata } from "next";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Card } from "@/components/ui/card";
import { BotBrain, type BotSectionRow } from "@/components/admin/bot-brain";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { waConfigured } from "@/lib/whatsapp";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Bot beyni",
  path: "/admin/bot",
  noIndex: true,
});

/**
 * WhatsApp botunun bilik bazası — admin burada botun nə biləcəyini görür və
 * redaktə edir. Sərt təhlükəsizlik qaydaları kodda saxlanılır (aşağıda
 * göstərilir, amma dəyişdirilə bilmir) — bax `src/lib/wa-bot.ts`.
 */
export default async function AdminBotPage() {
  const admin = await requireRole("ADMIN", "/admin/bot");
  const rows = await prisma.botSection.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  const sections: BotSectionRow[] = rows.map((r) => ({
    id: r.id, title: r.title, content: r.content, order: r.order,
    isActive: r.isActive, updatedAt: r.updatedAt.toISOString(),
  }));
  const live = waConfigured();

  return (
    <AdminShell title="Bot beyni" userName={admin.phone}>
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-ink-900">WhatsApp botunun bilik bazası</p>
            <p className="mt-1 text-sm text-slate-600">
              Bot cavablarını bu bölmələrdən qurur. Redaktə et → yadda saxla → sağdakı
              qutuda dərhal sına. Söndürülən bölməni bot «unudur».
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
              live
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-amber-50 text-amber-800 ring-amber-100"
            }`}
          >
            {live ? "WhatsApp qoşulub" : "WhatsApp gözləyir (Meta qurulumu)"}
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
          <strong>Dəyişməz qaydalar (kodda):</strong> bot özünü təqdim edir · qısa yazır ·
          qiymət/endirim vəd etmir · hesab rəqəmləri demir · tibbi məsləhət vermir ·
          şübhəli/mürəkkəb halda operatora yönləndirir. Bunlar buradan dəyişdirilə bilməz —
          təhlükəsizlik təminatıdır.
        </p>
      </Card>
      <BotBrain sections={sections} />
    </AdminShell>
  );
}
