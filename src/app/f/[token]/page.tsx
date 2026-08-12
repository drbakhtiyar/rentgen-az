import type { Metadata } from "next";
import { MessageCircleQuestion, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { QuickFaqForm } from "@/components/forms/quick-faq-form";
import { resolveFaqToken } from "@/lib/price-invite";
import { logTokenVisit } from "@/lib/link-visit";
import { CENTER_FAQ_QUESTIONS } from "@/content/center-faq";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Şəxsi link — indekslənmir.
export const metadata: Metadata = buildMetadata({ title: "Tez-tez verilən suallar", noIndex: true });

/**
 * Girişsiz FAQ doldurma səhifəsi (WhatsApp FAQ kampaniyası).
 * /q qiymət formu ilə eyni token — bax `src/lib/price-invite.ts`.
 */
export default async function QuickFaqPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const target = await resolveFaqToken(token);

  if (!target) {
    return (
      <div className="bg-surface py-10 sm:py-16">
        <Container className="max-w-lg">
          <Card className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300" />
            <h1 className="font-display mt-4 text-xl font-bold text-ink-900">Link keçərli deyil</h1>
            <p className="mt-2 text-sm text-slate-600">
              Bu linkin müddəti bitib və ya səhv daxil edilib. Cavabları mərkəz
              panelindən də əlavə edə bilərsiniz.
            </p>
            <ButtonLink href="/giris" className="mt-6">Mərkəz girişi</ButtonLink>
          </Card>
        </Container>
      </div>
    );
  }

  await logTokenVisit(target.centerId, "f");

  const questions = CENTER_FAQ_QUESTIONS.map((q) => ({
    key: q.key,
    text: q.az,
    hint: q.hint?.az,
  }));

  return (
    <div className="bg-surface py-10 sm:py-16">
      <Container className="max-w-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <MessageCircleQuestion className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
            {target.centerName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Pasiyentlər mərkəz seçəndə əvvəlcə bu 10 praktik suala baxır — ödəniş
            üsulu, parkinq, əlil arabası ilə giriş, nəticənin müddəti. Cavabları
            dolu olan mərkəzlər həm daha çox müraciət alır, həm də Google-da bu
            suallarla axtarışda önə çıxır. Doldurmaq 2-3 dəqiqə çəkir.
          </p>
        </div>
        <Card className="p-6 sm:p-8">
          <QuickFaqForm token={token} questions={questions} initial={target.answers} />
        </Card>
      </Container>
    </div>
  );
}
