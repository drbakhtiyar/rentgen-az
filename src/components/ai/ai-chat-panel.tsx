"use client";

import * as React from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { askAiAssistantAction } from "@/app/actions/ai";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

type Msg = { role: "user" | "assistant"; content: string };

/** Render bare URLs in AI answers as clickable links. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)"'<>]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            {p.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

/**
 * Self-contained AI helper thread (conversation is session-local, nothing is
 * stored). Used inside the chat interface and on the CRM/admin AI pages.
 */
export function AiChatPanel({ embedded }: { embedded?: boolean }) {
  const ct = getPanelDict(useLocale()).chat;
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    const res = await askAiAssistantAction(next);
    setBusy(false);
    if (!res.ok || !res.answer) {
      setError(res.error ?? "Xəta baş verdi.");
      return;
    }
    setMessages([...next, { role: "assistant", content: res.answer }]);
  }

  return (
    <div className={embedded ? "flex min-h-0 flex-1 flex-col" : "flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"}>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50/50 p-4">
        {/* Greeting */}
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl bg-white px-3 py-2 text-sm text-ink-900 ring-1 ring-slate-200">
            <p className="whitespace-pre-wrap break-words">{ct.aiGreeting}</p>
          </div>
        </div>
        {messages.map((m, i) => (
          <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm " +
                (m.role === "user" ? "bg-brand-600 text-white" : "bg-white text-ink-900 ring-1 ring-slate-200")
              }
            >
              <p className="whitespace-pre-wrap break-words">
                {m.role === "assistant" ? <Linkified text={m.content} /> : m.content}
              </p>
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-200">
              <Sparkles className="h-4 w-4 animate-pulse text-brand-500" />
              {ct.aiThinking}
            </div>
          </div>
        )}
      </div>

      {error && <p className="px-4 py-1 text-xs font-medium text-red-600">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ct.aiPlaceholder}
          className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-brand-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
      <p className="border-t border-slate-50 px-4 py-1.5 text-center text-[10px] text-slate-400">{ct.aiDisclaimer}</p>
    </div>
  );
}
