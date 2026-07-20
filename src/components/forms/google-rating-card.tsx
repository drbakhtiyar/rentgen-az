"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Trash2, CheckCircle2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/reviews/stars";
import { saveGooglePlaceAction, removeGooglePlaceAction } from "@/app/merkez/actions";
import { useLocale } from "@/components/locale-context";

type Current = {
  placeId: string | null;
  rating: number | null;
  reviewCount: number | null;
  updatedAt: string | null;
};

const AZ = {
  title: "Google reytinqi",
  desc: "Google-dakı reytinqinizi mərkəz səhifənizdə göstərin. Biznesinizin adını (məs. «Rentgen Mərkəzi Bakı») və ya Google Maps linkini / Place ID-ni yazın — sistem reytinqi özü tapıb göstərəcək.",
  placeholder: "Biznes adı, Google Maps linki və ya Place ID",
  check: "Yoxla və göstər",
  refresh: "Yenilə",
  remove: "Sil",
  shown: "Səhifənizdə göstərilir",
  reviews: "rəy",
  updated: "Yeniləndi",
  removeConfirm: "Google reytinqini səhifədən silmək istəyirsiniz?",
  findHint: "Place ID-ni tapmaq üçün:",
  findLink: "Google Place ID Finder",
};

const RU = {
  title: "Рейтинг Google",
  desc: "Показывайте ваш рейтинг Google на странице центра. Введите название бизнеса (напр. «Рентген Центр Баку»), ссылку Google Maps или Place ID — система сама найдёт и покажет рейтинг.",
  placeholder: "Название, ссылка Google Maps или Place ID",
  check: "Проверить и показать",
  refresh: "Обновить",
  remove: "Удалить",
  shown: "Показывается на вашей странице",
  reviews: "отзывов",
  updated: "Обновлено",
  removeConfirm: "Убрать рейтинг Google со страницы?",
  findHint: "Чтобы найти Place ID:",
  findLink: "Google Place ID Finder",
};

export function GoogleRatingCard({ current }: { current: Current }) {
  const router = useRouter();
  const t = useLocale() === "ru" ? RU : AZ;
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasRating = current.rating != null;

  async function save(q: string) {
    setBusy(true);
    setError(null);
    const res = await saveGooglePlaceAction({ query: q });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setQuery("");
    router.refresh();
  }

  async function remove() {
    if (!confirm(t.removeConfirm)) return;
    setBusy(true);
    await removeGooglePlaceAction();
    setBusy(false);
    router.refresh();
  }

  return (
    <Card className="mt-6 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
        </span>
        <h2 className="font-display text-lg font-bold text-ink-900">{t.title}</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.desc}</p>

      {hasRating && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <span className="text-2xl font-bold text-ink-900">{current.rating!.toFixed(1)}</span>
          <Stars value={current.rating!} />
          <span className="text-sm text-slate-500">
            {current.reviewCount ?? 0} {t.reviews} · Google
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {t.shown}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1"
        />
        <Button onClick={() => save(query)} disabled={busy || query.trim().length < 3}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {hasRating ? t.refresh : t.check}
        </Button>
        {hasRating && (
          <Button variant="ghost" onClick={remove} disabled={busy} className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> {t.remove}
          </Button>
        )}
      </div>

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}

      <p className="mt-3 text-xs text-slate-400">
        {t.findHint}{" "}
        <a
          href="https://developers.google.com/maps/documentation/places/web-service/place-id"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-600 underline"
        >
          {t.findLink}
        </a>
      </p>
    </Card>
  );
}
