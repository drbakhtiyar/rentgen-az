"use client";

import * as React from "react";
import { Loader2, Send, Bot } from "lucide-react";
import { askBotTestAction } from "@/app/bot-sinaq/[token]/actions";

type Msg = { role: "user" | "assistant"; content: string };

// URL-ləri kliklənən linkə, *mətn*-i qalına çevirir (WhatsApp davranışı).
const URL_RE =
  /(https?:\/\/[^\s]+|(?:www\.)?rentgen\.az(?:\/[^\s]*)?|wa\.me\/[^\s]+|crm\.rentgen\.az(?:\/[^\s]*)?)/g;

function renderRich(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let key = 0;
  const boldify = (chunk: string) =>
    chunk.split(/\*([^*\n]+)\*/g).map((part, i) =>
      i % 2 === 1 ? <strong key={`b${key++}`}>{part}</strong> : part,
    );
  for (const seg of text.split(URL_RE)) {
    if (!seg) continue;
    if (URL_RE.test(seg) && !/\s/.test(seg)) {
      URL_RE.lastIndex = 0;
      // sondakı durğu işarəsi linkə düşməsin
      const m = seg.match(/^([^]*?)([.,;:!?)]*)$/)!;
      const href = m[1].startsWith("http") ? m[1] : `https://${m[1]}`;
      out.push(
        <a
          key={`l${key++}`}
          href={href}
          target="_blank"
          rel="noopener"
          className="font-semibold text-brand-700 underline underline-offset-2"
        >
          {m[1]}
        </a>,
      );
      if (m[2]) out.push(m[2]);
    } else {
      URL_RE.lastIndex = 0;
      out.push(...boldify(seg));
    }
  }
  return out;
}

/** WhatsApp-vari sınaq çatı — bot beyninin canlı simulyasiyası. */
export function BotTestChat({ token }: { token: string }) {
  const [msgs, setMsgs] = React.useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Salam! Mən rentgen.az-ın WhatsApp botuyam (sınaq rejimi). Mərkəz kimi istənilən sualı yazın — qeydiyyat, qiymətlər, kabinet, linklər… Necə cavab verdiyimi yoxlayın 👋",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Yalnız çat qutusunun DAXİLİNDƏ skrol — scrollIntoView bütün səhifəni
  // dartırdı (istifadəçi şikayəti), scrollTop isə konteynerlə məhdudlaşır.
  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, pending]);

  function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    setInput("");
    const history = msgs.slice(1); // salamlama mesajı tarixçəyə daxil edilmir
    setMsgs((m) => [...m, { role: "user", content: text }]);
    startTransition(async () => {
      const res = await askBotTestAction({ token, message: text, history });
      if (res.ok && res.answer) {
        setMsgs((m) => [...m, { role: "assistant", content: res.answer! }]);
      } else {
        setError(res.error ?? "Xəta baş verdi.");
      }
    });
  }

  return (
    <div className="flex h-[70vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#e5ddd5]">
      {/* Başlıq — WhatsApp üslubunda */}
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Rentgen.az botu</p>
          <p className="text-[11px] text-emerald-100">sınaq rejimi · real mesaj getmir</p>
        </div>
      </div>

      {/* Mesajlar */}
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm ${
                m.role === "user" ? "rounded-br-none bg-[#dcf8c6] text-ink-900" : "rounded-bl-none bg-white text-ink-900"
              }`}
            >
              {renderRich(m.content)}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-bl-none bg-white px-3 py-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        {error && (
          <p className="mx-auto max-w-sm rounded-lg bg-rose-50 px-3 py-2 text-center text-xs text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        )}
      </div>

      {/* Giriş sahəsi */}
      <form onSubmit={send} className="flex items-center gap-2 bg-[#f0f0f0] px-3 py-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesaj yazın…"
          maxLength={1500}
          className="h-10 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          aria-label="Göndər"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
