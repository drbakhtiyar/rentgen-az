import type { Metadata } from "next";
import { ClipboardCheck, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { QuickCardForm } from "@/components/forms/quick-card-form";
import { resolveCardToken } from "@/lib/price-invite";
import { logTokenVisit } from "@/lib/link-visit";
import { parseHours } from "@/lib/hours";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Şəxsi link — indekslənmir.
export const metadata: Metadata = buildMetadata({ title: "Mərkəz kartı", noIndex: true });

/**
 * Girişsiz KART səhifəsi (WhatsApp kart kampaniyası): xidmət təsdiqi (sil/əlavə)
 * + qiymətlər + iş saatları. /q ilə eyni token — bax `src/lib/price-invite.ts`.
 */
export default async function QuickCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const target = await resolveCardToken(token);

  if (!target) {
    return (
      <div className="bg-surface py-10 sm:py-16">
        <Container className="max-w-lg">
          <Card className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300" />
            <h1 className="font-display mt-4 text-xl font-bold text-ink-900">Link keçərli deyil</h1>
            <p className="mt-2 text-sm text-slate-600">
              Bu linkin müddəti bitib və ya səhv daxil edilib. Kartınızı mərkəz
              panelindən də idarə edə bilərsiniz.
            </p>
            <ButtonLink href="/giris" className="mt-6">Mərkəz girişi</ButtonLink>
          </Card>
        </Container>
      </div>
    );
  }

  await logTokenVisit(target.centerId, "m");

  return (
    <div className="bg-surface py-10 sm:py-16">
      <Container className="max-w-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <ClipboardCheck className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
            {target.centerName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Kartınızdakı məlumatı yalnız siz dəqiq bilirsiniz. Xidmət siyahınızı
            təsdiqləyin, qiymət və iş saatlarınızı yazın — dəqiq kart pasiyentə
            inam verir, sizi axtarışda önə çıxarır və zəngsiz müraciət gətirir.
          </p>
        </div>
        <Card className="p-6 sm:p-8">
          <QuickCardForm
            token={token}
            rows={target.rows}
            addable={target.addable}
            initialHours={parseHours(target.hours)}
          />
        </Card>
      </Container>
    </div>
  );
}
