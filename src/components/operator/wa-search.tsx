import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WaSendRow } from "@/components/operator/wa-send-row";
import { searchWaCandidates } from "@/lib/price-invite";

/**
 * Əl ilə mərkəz seçimi (istifadəçi istəyi, 2026-08-10): avtomatik günlük 12-liyə
 * düşməyən mərkəzi adla axtarıb elə buradaca göndərmək. GET forması — JS-siz,
 * server renderli; nəticələr eyni WaSendRow ilə çıxır, göndəriş eyni ortaq
 * limitə sayılır. "Göndərilib"/"qiyməti var" hallar nişanla bildirilir.
 */
export async function WaSearch({
  q,
  basePath,
  kind = "price",
  extraParams = {},
}: {
  q: string;
  basePath: string;
  kind?: "price" | "faq" | "card" | "cabinet";
  /** Formada gizli saxlanacaq əlavə query parametrləri (məs. tab). */
  extraParams?: Record<string, string>;
}) {
  const results = q.trim().length >= 2 ? await searchWaCandidates(q, kind) : [];

  return (
    <Card className="mb-5 p-5">
      <form action={basePath} className="flex items-center gap-2">
        {Object.entries(extraParams).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Mərkəzi adla axtar və siyahıya salmadan göndər…"
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-950"
        >
          Axtar
        </button>
      </form>

      {q.trim().length >= 2 && (
        <div className="mt-4 space-y-3">
          {results.length > 0 ? (
            results.map((c) => (
              <WaSendRow
                key={c.centerId}
                centerId={c.centerId}
                name={c.name}
                city={c.city}
                status={c.status}
                waPhone={c.waPhone}
                waUrl={c.waUrl}
                reviews={c.googleReviewCount}
                kind={kind}
                reason={c.reason}
                note={
                  c.alreadySentAt
                    ? `⚠ artıq göndərilib (${c.alreadySentAt.toLocaleDateString("az-AZ")})`
                    : c.hasPrices
                      ? kind === "faq"
                        ? "cavabların çoxu artıq dolu"
                        : "qiymətləri artıq var"
                      : undefined
                }
              />
            ))
          ) : (
            <p className="text-sm text-slate-500">
              «{q}» üzrə mobil nömrəli mərkəz tapılmadı. (Yalnız mobil
              WhatsApp/telefonu olan mərkəzlər göstərilir — şəhər nömrəsinə wa.me
              işləmir.)
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
