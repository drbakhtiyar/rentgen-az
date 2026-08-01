import type { Metadata } from "next";
import { Star, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { InviteReviewForm } from "@/components/reviews/invite-review-form";
import { resolveInvite } from "@/lib/review-invite";
import { buildMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Şəxsi link — heç vaxt indekslənməməlidir.
export const metadata: Metadata = buildMetadata({ title: "Rəy yaz", noIndex: true });

export default async function InviteReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const target = await resolveInvite(token);
  const locale = await getLocale();
  const t = getDict(locale).reviews;

  if (!target) {
    return (
      <div className="bg-surface py-10 sm:py-16">
        <Container className="max-w-xl">
          <Card className="p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300" />
            <h1 className="font-display mt-4 text-xl font-bold text-ink-900">
              {t.inviteExpiredTitle}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{t.inviteExpiredDesc}</p>
            <ButtonLink href="/rentgen-merkezleri" className="mt-6">
              {t.gotoCenter}
            </ButtonLink>
          </Card>
        </Container>
      </div>
    );
  }

  const firstName = target.patientName.trim().split(/\s+/)[0];

  return (
    <div className="bg-surface py-10 sm:py-16">
      <Container className="max-w-xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
            {t.inviteTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {firstName ? `${firstName}, ` : ""}
            <span className="font-semibold text-ink-900">{target.centerName}</span>
            {locale === "ru" ? " — " : " — "}
            {t.inviteDesc}
          </p>
        </div>
        <Card className="p-6 sm:p-8">
          <InviteReviewForm
            token={token}
            centerSlug={target.centerSlug}
            locale={locale}
            defaultScores={
              target.existing
                ? {
                    service: target.existing.scoreService ?? 0,
                    staff: target.existing.scoreStaff ?? 0,
                    clean: target.existing.scoreClean ?? 0,
                    wait: target.existing.scoreWait ?? 0,
                    price: target.existing.scorePrice ?? 0,
                  }
                : undefined
            }
            defaultComment={target.existing?.comment ?? undefined}
          />
        </Card>
      </Container>
    </div>
  );
}
