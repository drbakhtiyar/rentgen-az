"use client";

import * as React from "react";
import Image from "next/image";
import {
  Send, Loader2, ArrowLeft, Search, Pin, Users, Stethoscope, Building2,
  Megaphone, MessageSquare, CheckCircle2, Paperclip, FileText,
} from "lucide-react";
import {
  adminFetchThreadMessagesAction,
  adminSendToUserAction,
  adminBroadcastAction,
  adminSearchUsersAction,
  requestAdminChatUploadUrlAction,
  getAdminChatFileUrlAction,
} from "@/app/actions/admin-chat";
import type { ChatMessage } from "@/app/actions/chat";
import type { AdminThreadItem, AdminSearchItem } from "@/lib/admin-chat";

const POLL_MS = 4000;

type Group = { key: "ALL" | "DOCTORS" | "CENTERS"; label: string; icon: React.ReactNode };
const GROUPS: Group[] = [
  { key: "ALL", label: "Hamısı (Həkim + Mərkəz)", icon: <Users className="h-4 w-4" /> },
  { key: "DOCTORS", label: "Həkimlər", icon: <Stethoscope className="h-4 w-4" /> },
  { key: "CENTERS", label: "Mərkəzlər", icon: <Building2 className="h-4 w-4" /> },
];

function hhmm(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("az", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function Avatar({ url, role }: { url: string | null; role: string }) {
  const Icon = role === "CENTER" ? Building2 : Stethoscope;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-600">
      {url ? (
        <Image src={url} alt="" width={36} height={36} className="h-full w-full object-cover" />
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </span>
  );
}

type ActiveUser = { userId: string; threadId: string | null; name: string; sub: string | null; role: string; avatarUrl: string | null };

export function AdminChatInterface({ threads }: { threads: AdminThreadItem[] }) {
  const [group, setGroup] = React.useState<Group["key"] | null>(null);
  const [active, setActive] = React.useState<ActiveUser | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AdminSearchItem[] | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [searching, setSearching] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async (threadId: string) => {
    const res = await adminFetchThreadMessagesAction(threadId);
    if (res.ok) setMessages(res.messages);
  }, []);

  React.useEffect(() => {
    const id = active?.threadId;
    if (!id) return;
    const run = () => void load(id);
    run();
    const t = setInterval(run, POLL_MS);
    return () => clearInterval(t);
  }, [active?.threadId, load]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Debounced search (handled in the input onChange, not an effect).
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSearchChange(v: string) {
    setQuery(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = v.trim();
    if (!q) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const res = await adminSearchUsersAction(q);
      setSearching(false);
      if (res.ok) setResults(res.users);
    }, 350);
  }

  function openThread(t: AdminThreadItem) {
    setGroup(null);
    setError(null);
    setDone(null);
    setMessages([]);
    setActive({ userId: t.userId, threadId: t.threadId, name: t.name, sub: t.sub, role: t.role, avatarUrl: t.avatarUrl });
  }
  function openSearchUser(u: AdminSearchItem) {
    setGroup(null);
    setError(null);
    setDone(null);
    setMessages([]);
    setQuery("");
    setResults(null);
    setActive({ userId: u.userId, threadId: null, name: u.name, sub: u.sub, role: u.role, avatarUrl: u.avatarUrl });
  }

  async function sendToUser(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !active) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, senderId: "admin", senderRole: "ADMIN", content: text, hasFile: false, fileName: null, readAt: null, createdAt: new Date().toISOString(), mine: true },
    ]);
    const res = await adminSendToUserAction(active.userId, text);
    setSending(false);
    if (!res.ok) return setError(res.error);
    setActive((a) => (a ? { ...a, threadId: res.threadId } : a));
    load(res.threadId);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    setError(null);
    setUploading(true);
    try {
      const contentType = file.type || "application/octet-stream";
      const signed = await requestAdminChatUploadUrlAction({ targetUserId: active.userId, fileName: file.name, contentType, size: file.size });
      if (!signed.ok) return setError(signed.error);
      const put = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
      if (!put.ok) return setError("Fayl yüklənmədi. Yenidən cəhd edin.");
      setMessages((prev) => [
        ...prev,
        { id: `tmp-${Date.now()}`, senderId: "admin", senderRole: "ADMIN", content: "", hasFile: true, fileName: file.name, readAt: null, createdAt: new Date().toISOString(), mine: true },
      ]);
      const res = await adminSendToUserAction(active.userId, "", { key: signed.key, name: file.name });
      if (!res.ok) return setError(res.error);
      setActive((a) => (a ? { ...a, threadId: res.threadId } : a));
      load(res.threadId);
    } catch {
      setError("Fayl yüklənmədi. Yenidən cəhd edin.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function openFile(messageId: string) {
    if (messageId.startsWith("tmp-")) return;
    const res = await getAdminChatFileUrlAction(messageId);
    if (!res.ok) return setError(res.error);
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !group) return;
    setSending(true);
    setError(null);
    setDone(null);
    const res = await adminBroadcastAction(group, text);
    setSending(false);
    if (!res.ok) return setError(res.error);
    setInput("");
    setDone(`${res.count} istifadəçiyə göndərildi.`);
  }

  return (
    <div className="flex h-[72vh] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Left list */}
      <aside className={"w-full shrink-0 overflow-y-auto border-r border-slate-100 sm:w-80 " + (group || active ? "hidden sm:block" : "block")}>
        {/* Pinned broadcast groups */}
        <div className="border-b border-slate-100 p-2">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Toplu mesaj</p>
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => { setGroup(g.key); setActive(null); setError(null); setDone(null); setInput(""); }}
              className={"flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 " + (group === g.key ? "bg-brand-50" : "")}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">{g.icon}</span>
              <span className="flex-1 font-medium text-ink-900">{g.label}</span>
              <Pin className="h-3.5 w-3.5 text-slate-300" />
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ad və ya nömrə ilə axtar…"
              className="w-full rounded-full border border-slate-200 py-1.5 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Search results OR existing threads */}
        {results !== null ? (
          <ul className="divide-y divide-slate-100">
            {searching && <li className="p-4 text-center text-xs text-slate-400">Axtarılır…</li>}
            {!searching && results.length === 0 && <li className="p-4 text-center text-xs text-slate-400">Nəticə yoxdur.</li>}
            {results.map((u) => (
              <li key={u.userId}>
                <button type="button" onClick={() => openSearchUser(u)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                  <Avatar url={u.avatarUrl} role={u.role} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink-900">{u.name}</span>
                    <span className="block truncate text-xs text-slate-400">{u.sub ?? (u.role === "CENTER" ? "Mərkəz" : "Həkim")}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-slate-100">
            {threads.length === 0 && <li className="p-4 text-center text-xs text-slate-400">Hələ söhbət yoxdur.</li>}
            {threads.map((t) => (
              <li key={t.threadId}>
                <button type="button" onClick={() => openThread(t)} className={"flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 " + (active?.userId === t.userId ? "bg-brand-50" : "")}>
                  <Avatar url={t.avatarUrl} role={t.role} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-ink-900">{t.name}</span>
                      {t.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">{t.unread}</span>}
                    </span>
                    <span className="block truncate text-xs text-slate-400">{t.preview ?? t.sub ?? "—"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Right panel */}
      <section className={"flex min-w-0 flex-1 flex-col " + (group || active ? "flex" : "hidden sm:flex")}>
        {group ? (
          <BroadcastPanel
            group={GROUPS.find((g) => g.key === group)!}
            input={input}
            setInput={setInput}
            onSend={sendBroadcast}
            sending={sending}
            error={error}
            done={done}
            onBack={() => setGroup(null)}
          />
        ) : !active ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-300">
            <MessageSquare className="h-10 w-10" />
            <p className="mt-2 text-sm text-slate-400">Söhbət və ya toplu mesaj seçin</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <button type="button" onClick={() => setActive(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100 sm:hidden"><ArrowLeft className="h-5 w-5" /></button>
              <Avatar url={active.avatarUrl} role={active.role} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{active.name}</p>
                {active.sub && <p className="truncate text-xs text-slate-400">{active.sub}</p>}
              </div>
            </header>
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50/50 p-4">
              {messages.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Mesaj yoxdur. İlk mesajı yazın.</p>}
              {messages.map((m) => (
                <div key={m.id} className={"flex " + (m.mine ? "justify-end" : "justify-start")}>
                  <div className={"max-w-[80%] rounded-2xl px-3 py-2 text-sm " + (m.mine ? "bg-brand-600 text-white" : "bg-white text-ink-900 ring-1 ring-slate-200")}>
                    {m.hasFile && (
                      <button type="button" onClick={() => openFile(m.id)} className={"mb-1 flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium " + (m.mine ? "bg-white/15 hover:bg-white/25" : "bg-slate-100 hover:bg-slate-200")}>
                        <FileText className="h-4 w-4 shrink-0" /> <span className="truncate">{m.fileName ?? "fayl"}</span>
                      </button>
                    )}
                    {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                    <span className={"mt-0.5 block text-right text-[10px] " + (m.mine ? "text-white/70" : "text-slate-400")}>{hhmm(m.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="px-4 py-1 text-xs font-medium text-red-600">{error}</p>}
            <form onSubmit={sendToUser} className="flex items-center gap-2 border-t border-slate-100 p-3">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onPickFile} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || sending} title="Fayl əlavə et" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mesaj yazın…" className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              <button type="submit" disabled={sending || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function BroadcastPanel({
  group, input, setInput, onSend, sending, error, done, onBack,
}: {
  group: Group;
  input: string;
  setInput: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  sending: boolean;
  error: string | null;
  done: string | null;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <button type="button" onClick={onBack} className="rounded p-1 text-slate-500 hover:bg-slate-100 sm:hidden"><ArrowLeft className="h-5 w-5" /></button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Megaphone className="h-4 w-4" /></span>
        <div>
          <p className="font-semibold text-ink-900">Toplu mesaj</p>
          <p className="text-xs text-slate-400">{group.label}</p>
        </div>
      </header>
      <div className="flex-1 p-4">
        <p className="mb-2 text-sm text-slate-600">
          Bu mesaj <span className="font-semibold">{group.label}</span> qrupundakı bütün qeydiyyatlı istifadəçilərin söhbətinə göndəriləcək.
        </p>
        <form onSubmit={onSend} className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="Məsələn: Sabah 10:00–12:00 texniki işlər aparılacaq…"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-brand-400 focus:outline-none"
          />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {done && <p className="flex items-center gap-1 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {done}</p>}
          <button type="submit" disabled={sending || !input.trim()} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />} Göndər
          </button>
        </form>
      </div>
    </div>
  );
}
