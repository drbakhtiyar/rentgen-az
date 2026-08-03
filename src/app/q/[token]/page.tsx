import type { Metadata } from "next";
import { Banknote, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { QuickPriceForm } from "@/components/forms/quick-price-form";
import { resolvePriceToken } from "@/lib/price-invite";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Şəxsi link — indekslənmir.
export const metadata: Metadata = buildMetadata({ title: "Qiymətlər", noIndex: true });

/**
 * Girişsiz sürətli qiymət səhifəsi (WhatsApp kampaniyası).
 * Bax `src/lib/price-invite.ts` — token sahibliyi kimliyi sübut edir.
 */
export default async function QuickPricePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const target = await resolvePriceToken(token);

  if (!target) {
    return (
      <div className="bg-surface py-10 sm:py-16">
        <Container className="max-w-lg">
          <Card className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300" />
            <h1 className="font-display mt-4 text-xl font-bold text-ink-900">Link keçərli deyil</h1>
            <p className="mt-2 text-sm text-slate-600">
              Bu linkin müddəti bitib və ya səhv daxil edilib. Qiymətləri mərkəz panelindən də
              əlavə edə bilərsiniz.
            </p>
            <ButtonLink href="/giris" className="mt-6">Mərkəz girişi</ButtonLink>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-surface py-10 sm:py-16">
      <Container className="max-w-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Banknote className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
            {target.centerName}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Xidmətlərinizin qiymətini qeyd edin — rentgen.az-da səhifənizdə dərhal görünəcək
            və pasiyentlər sizi qiymətə görə də tapacaq.
          </p>
        </div>
        <Card className="p-6 sm:p-8">
          {target.rows.length > 0 ? (
            <QuickPriceForm token={token} rows={target.rows} />
          ) : (
            <p className="text-center text-sm text-slate-500">
              Xidmət siyahınız hələ boşdur — əvvəlcə rentgen.az komandası ilə xidmətlərinizi
              dəqiqləşdirin.
            </p>
          )}
        </Card>
      </Container>
    </div>
  );
}
