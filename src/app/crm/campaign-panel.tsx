"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, CheckCircle2 } from "lucide-react";
import { sendCampaignAction, type CampaignAudience } from "./actions";

type Counts = { all: number; lapsed: number; insystem: number };

const AUDIENCES: { key: CampaignAudience; label: string; hint: string }[] = [
  { key: "all", label: "Bütün pasiyentlər", hint: "bazadakı hər kəs" },
  { key: "lapsed", label: "Gəlməyənlər", hint: "90+ gün aktivliyi olmayan" },
  { key: "insystem", label: "Sistemdə olanlar", hint: "qeydiyyatlı pasiyentlər" },
];

/** SMS campaign composer: pick an audience, write the text, send from balance. */
export function CampaignPanel({ counts, balance }: { counts: Counts; balance: number }) {
  const router = useRouter();
  const [audience, setAudience] = React.useState<CampaignAudience>("all");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);

  const recipients = counts[audience === "all" ? "all" : audience === "lapsed" ? "lapsed" : "insystem"];
  const canSend = message.trim().length > 0 && recipients > 0 && balance > 0 && !busy;

  async function send() {
    const n = Math.min(recipients, balance);
    if (
      !confirm(
        `Kampaniya ${recipients} pasiyentə göndəriləcək (balansdan ~${n} SMS düşəcək). Davam edilsin?`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await sendCampaignAction({ audience, message });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    let text = `Göndərildi: ${res.sent}`;
    if (res.failed > 0) text += ` · alınmadı: ${res.failed}`;
    if (res.skipped > 0) text += ` · limit səbəbiylə qaldı: ${res.skipped}`;
    if (res.noBalance) text += " · balans bitdiyi üçün dayandı";
    setResult(text);
    setMessage("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {AUDIENCES.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setAudience(a.key)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
              audience === a.key
                ? "border-brand-300 bg-brand-50 text-brand-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="block font-semibold">
              {a.label} · {counts[a.key]}
            </span>
            <span className="text-xs opacity-70">{a.hint}</span>
          </button>
        ))}
      </div>

      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="Kampaniya mətni — məs.: Bu həftə panoramik rentgen 20% endirimlə! Randevu üçün zəng edin."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>{message.length}/400 · uzun mətn operator tərəfdə bir neçə SMS kimi hesablana bilər</span>
          <span>
            Alıcı: <span className="font-semibold text-slate-600">{recipients}</span> · Balans:{" "}
            <span className={`font-semibold ${balance < recipients ? "text-amber-600" : "text-slate-600"}`}>
              {balance}
            </span>
          </span>
        </div>
      </div>

      {balance < recipients && balance > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Balans auditoriyadan azdır — göndəriş balans bitəndə dayanacaq ({balance}/{recipients}).
        </p>
      )}

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {result && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {result}
        </p>
      )}

      <button
        type="button"
        disabled={!canSend}
        onClick={send}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
        Kampaniyanı göndər
      </button>
    </div>
  );
}
