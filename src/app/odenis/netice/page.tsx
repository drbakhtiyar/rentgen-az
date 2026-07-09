import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Ödəniş nəticəsi",
  path: "/odenis/netice",
  noIndex: true,
});

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const { ok } = await searchParams;
  const success = ok === "1";

  return (
    <div className="bg-surface py-16">
      <Container className="max-w-md">
        <Card className="p-8 text-center">
          {success ? (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
              <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
                Ödəniş uğurlu oldu
              </h1>
              <p className="mt-2 text-slate-600">
                Ödənişiniz qəbul edildi. Təşəkkür edirik!
              </p>
            </>
          ) : (
            <>
              <XCircle className="mx-auto h-14 w-14 text-red-500" />
              <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
                Ödəniş tamamlanmadı
              </h1>
              <p className="mt-2 text-slate-600">
                Ödəniş baş tutmadı və ya ləğv edildi. Yenidən cəhd edə bilərsiniz.
              </p>
            </>
          )}
          <div className="mt-6">
            <ButtonLink href="/">Ana səhifəyə qayıt</ButtonLink>
          </div>
          <Link href="/elaqe" className="mt-3 block text-sm text-slate-400 hover:text-brand-600">
            Problem yaşadınız? Bizimlə əlaqə saxlayın
          </Link>
        </Card>
      </Container>
    </div>
  );
}
