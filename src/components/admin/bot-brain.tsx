"use client";

import * as React from "react";
import { Loader2, Plus, Save, Trash2, Eye, EyeOff, Send, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  saveBotSectionAction,
  deleteBotSectionAction,
  testBotAction,
} from "@/app/admin/bot/actions";

export type BotSectionRow = {
  id: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  updatedAt: string;
};

/* ------------------------------------------------ bölmə redaktoru ---- */

function SectionCard({ row, onDone }: { row: BotSectionRow | null; onDone: () => void }) {
  const [title, setTitle] = React.useState(row?.title ?? "");
  const [content, setContent] = React.useState(row?.content ?? "");
  const [order, setOrder] = React.useState(row?.order ?? 0);
  const [isActive, setIsActive] = React.useState(row?.isActive ?? true);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);

  async function save() {
    setPending(true); setError(null);
    const res = await saveBotSectionAction({ id: row?.id, title, content, order, isActive });
    setPending(false);
    if (!res.ok) { setError(res.error ?? "Xəta"); return; }
    setDirty(false);
    onDone();
  }
  async function del() {
    if (!row) return;
    if (!window.confirm(`"${row.title}" bölməsi silinsin? Bot bunu artıq bilməyəcək.`)) return;
    setPending(true);
    await deleteBotSectionAction(row.id);
    setPending(false);
    onDone();
  }

  return (
    <Card className={`p-5 ${!isActive ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
          placeholder="Bölmənin adı (məs. Niyə qiymət yazmalı)"
          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-ink-900 outline-none focus:border-brand-500"
        />
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          Sıra
          <input
            type="number"
            value={order}
            onChange={(e) => { setOrder(Number(e.target.value) || 0); setDirty(true); }}
            className="h-10 w-16 rounded-lg border border-slate-300 px-2 text-center text-sm outline-none focus:border-brand-500"
          />
        </label>
        <button
          type="button"
          onClick={() => { setIsActive((v) => !v); setDirty(true); }}
          className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ring-1 ${
            isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"
          }`}
          title={isActive ? "Aktiv — prompta daxildir" : "Söndürülüb — bot bunu görmür"}
        >
          {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {isActive ? "Aktiv" : "Söndürülüb"}
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setDirty(true); }}
        rows={Math.min(14, Math.max(4, content.split("\n").length + 1))}
        placeholder="Botun biləcəyi mətn…"
        className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm leading-relaxed text-ink-900 outline-none focus:border-brand-500"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          {content.length} simvol
          {row && ` · yenilənib: ${new Date(row.updatedAt).toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" })}`}
        </p>
        <div className="flex items-center gap-2">
          {row && (
            <button
              type="button"
              onClick={del}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Sil
            </button>
          )}
          <Button size="sm" onClick={save} disabled={pending || !dirty}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {row ? "Yadda saxla" : "Əlavə et"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </Card>
  );
}

/* --------------------------------------------------- test qutusu ---- */

function TestBox() {
  const [q, setQ] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [log, setLog] = React.useState<{ q: string; a: string }[]>([]);
  const [meta, setMeta] = React.useState<string | null>(null);

  async function ask() {
    if (!q.trim() || pending) return;
    setPending(true);
    const res = await testBotAction({ question: q, simulatePhone: phone || undefined });
    setPending(false);
    setLog((l) => [...l, { q, a: res.ok ? res.answer ?? "" : `⚠️ ${res.error}` }]);
    if (res.systemChars) setMeta(`prompt: ~${Math.round(res.systemChars / 1000)}k simvol`);
    setQ("");
  }

  return (
    <Card className="p-5">
      <h2 className="font-display flex items-center gap-2 text-lg font-bold text-ink-900">
        <Bot className="h-5 w-5 text-brand-600" /> Botu sına
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Cari bilik bazası ilə cavab verir — WhatsApp qoşulmasa da işləyir. Dəyişikliyi
        yadda saxlayıb burada dərhal yoxlaya bilərsiniz. {meta && <span className="text-slate-400">({meta})</span>}
      </p>
      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
        {log.map((m, i) => (
          <div key={i}>
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-sm text-white">{m.q}</p>
            <p className="mt-1.5 w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-sm text-ink-900">{m.a}</p>
          </div>
        ))}
        {log.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-400">
            Məs.: «qiymət yazmaq pulludur?», «bu sayt nədir?», «operatorla danışmaq istəyirəm»
          </p>
        )}
      </div>
      <div className="mt-3 space-y-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mərkəz nömrəsini simulyasiya et (istəyə bağlı): +99450…"
          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-brand-500"
        />
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Mərkəzin sualını yaz…"
            className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
          />
          <Button size="sm" onClick={ask} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------- səhifə ----- */

export function BotBrain({ sections }: { sections: BotSectionRow[] }) {
  const [adding, setAdding] = React.useState(false);
  const refresh = () => { setAdding(false); window.location.reload(); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        {sections.map((s) => (
          <SectionCard key={s.id + s.updatedAt} row={s} onDone={refresh} />
        ))}
        {adding ? (
          <SectionCard row={null} onDone={refresh} />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 py-4 text-sm font-semibold text-slate-500 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" /> Yeni bölmə
          </button>
        )}
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start">
        <TestBox />
      </div>
    </div>
  );
}
