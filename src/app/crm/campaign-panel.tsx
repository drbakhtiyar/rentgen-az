"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, CheckCircle2 } from "lucide-react";
import { sendCampaignAction, type CampaignAudience } from "./actions";
import { useLocale } from "@/components/locale-context";
import { getCrmDict } from "@/lib/i18n-crm";

type Counts = { all: number; lapsed: number; insystem: number };



/** SMS campaign composer: pick an audience, write the text, send from balance. */
export function CampaignPanel({ counts, balance }: { counts: Counts; balance: number }) {
  const router = useRouter();
  const t = getCrmDict(useLocale());
  const AUDIENCES: { key: CampaignAudience; label: string; hint: string }[] = [
    { key: "all", label: t.campaign.audAll, hint: t.campaign.audAllHint },
    { key: "lapsed", label: t.campaign.audLapsed, hint: t.campaign.audLapsedHint },
    { key: "insystem", label: t.campaign.audSys, hint: t.campaign.audSysHint },
  ];
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
    let text = `${t.campaign.sent} ${res.sent}`;
    if (res.failed > 0) text += ` · ${t.campaign.failed} ${res.failed}`;
    if (res.skipped > 0) text += ` · ${t.campaign.left} ${res.skipped}`;
    if (res.noBalance) text += ` · ${t.campaign.stopped}`;
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
          placeholder={t.campaign.ph}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>{message.length}/400 · {t.campaign.counterNote}</span>
          <span>
            {t.campaign.recip} <span className="font-semibold text-slate-600">{recipients}</span> · {t.campaign.balance}{" "}
            <span className={`font-semibold ${balance < recipients ? "text-amber-600" : "text-slate-600"}`}>
              {balance}
            </span>
          </span>
        </div>
      </div>

      {balance < recipients && balance > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t.campaign.lowPre}{balance}{t.campaign.lowMid}{recipients}).
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
        {t.campaign.send}
      </button>
    </div>
  );
}
