import type { Metadata } from "next";
import { OperatorShell } from "@/components/operator/operator-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { botTestToken } from "@/lib/wa-bot";
import { SITE_URL } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "Bot beyni", path: "/panel", noIndex: true });

/** Bot beyni — operator üçün YALNIZ BAXIŞ (istifadəçi qərarı: edit imkanı
 *  olmasın; redaktə yalnız admin /admin/bot-da). */
export default async function PanelBotPage() {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  const sections = await prisma.botSection.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, title: true, content: true },
  });
  return (
    <OperatorShell title="Bot beyni" userName={user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator"} showNew={false}>
      <Card className="mb-5 p-5">
        <p className="font-display text-base font-bold text-ink-900">Botun bilik bazası (yalnız baxış)</p>
        <p className="mt-1 text-sm text-slate-600">
          Bot mərkəzlərə bu məlumatlarla cavab verir. Dəyişiklik lazımdırsa,
          adminə bildirin. Botu sınamaq üçün:{" "}
          <a
            href={`${SITE_URL}/bot-sinaq/${botTestToken()}`}
            target="_blank"
            rel="noopener"
            className="font-semibold text-brand-600 underline underline-offset-2"
          >
            sınaq səhifəsi
          </a>
        </p>
      </Card>
      <div className="space-y-4">
        {sections.map((s2, i) => (
          <Card key={s2.id} className="p-5">
            <p className="font-semibold text-ink-900">
              {i + 1}. {s2.title}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {s2.content}
            </p>
          </Card>
        ))}
      </div>
    </OperatorShell>
  );
}
