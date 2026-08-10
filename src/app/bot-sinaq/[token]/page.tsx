import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { BotTestChat } from "@/components/bot-test-chat";
import { botTestToken } from "@/lib/wa-bot";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Gizli sınaq linki — indekslənmir.
export const metadata: Metadata = buildMetadata({ title: "Bot sınağı", noIndex: true });

/**
 * WhatsApp botunun paylaşıla bilən sınaq səhifəsi (istifadəçi istəyi):
 * linki alan hər kəs girişsiz botla test rejimində danışır. Cavablar real
 * WhatsApp axını ilə eyni mühərrikdən gəlir. Link /admin/bot tabında görünür.
 */
export default async function BotTestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (token !== botTestToken()) {
    return (
      <div className="bg-surface py-16">
        <Container className="max-w-md">
          <Card className="p-8 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-slate-300" />
            <h1 className="font-display mt-4 text-xl font-bold text-ink-900">Link keçərli deyil</h1>
            <p className="mt-2 text-sm text-slate-600">
              Bu sınaq linki köhnəlib və ya səhv daxil edilib.
            </p>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-surface py-8 sm:py-12">
      <Container className="max-w-2xl">
        <div className="mb-5 text-center">
          <h1 className="font-display text-2xl font-bold text-ink-900">
            Rentgen.az botunun sınağı
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Bu, WhatsApp botumuzun test səhifəsidir — mərkəz (və ya pasiyent) kimi
            yazın, botun necə cavab verdiyini yoxlayın. Heç bir real mesaj göndərilmir.
          </p>
        </div>
        <BotTestChat token={token} />
        <p className="mt-4 text-center text-xs text-slate-400">
          Qeyri-dəqiq cavab görsəniz, zəhmət olmasa mövzunu bizə bildirin —
          botun biliyi redaktə olunandır.
        </p>
      </Container>
    </div>
  );
}
