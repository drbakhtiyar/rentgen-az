import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { QrReviewForm } from "@/components/reviews/qr-review-form";
import { prisma } from "@/lib/db";
import { getApprovedDoctors } from "@/lib/queries";
import { doctorName } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Rəy yaz",
  path: "/rey",
  noIndex: true,
});

export default async function QrReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const center = await prisma.centerProfile.findFirst({
    where: { slug, status: "APPROVED" },
    select: { name: true, slug: true },
  });
  if (!center) notFound();

  const locale = await getLocale();
  const t = getDict(locale).reviews;
  const doctors = await getApprovedDoctors();
  const doctorOptions = doctors.map((d) => ({
    value: d.id,
    label:
      doctorName(d.firstName, d.lastName) +
      (d.clinic ? ` — ${d.clinic}` : ""),
  }));

  return (
    <div className="bg-surface py-10 sm:py-16">
      <Container className="max-w-xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
            {center.name}{t.pageTitleSuffix}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t.pageDesc}
          </p>
        </div>
        <Card className="p-6 sm:p-8">
          <QrReviewForm
            centerSlug={center.slug}
            centerName={center.name}
            doctors={doctorOptions}
            locale={locale}
          />
        </Card>
      </Container>
    </div>
  );
}
