"use client";

import * as React from "react";
import Image from "next/image";
import { Send, Loader2, ArrowLeft, Check, CheckCheck, MessageSquare, Stethoscope, Building2, Search, Pin, LifeBuoy, Paperclip, FileText } from "lucide-react";
import {
  openConversationAction,
  sendMessageAction,
  fetchMessagesAction,
  requestChatUploadUrlAction,
  getChatFileUrlAction,
  type ChatMessage,
} from "@/app/actions/chat";
import {
  sendToAdminAction,
  fetchAdminThreadMessagesAction,
  requestAdminChatUploadUrlAction,
  getAdminChatFileUrlAction,
} from "@/app/actions/admin-chat";
import type { ChatContact } from "@/lib/chat";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";

const POLL_MS = 4000;

function ChatAvatar({
  url,
  name,
  size,
  Icon,
}: {
  url: string | null;
  name: string;
  size: number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-600"
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image src={url} alt={name} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <Icon className="h-1/2 w-1/2" />
      )}
    </span>
  );
}

function hhmm(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("az", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatInterface({
  contacts,
  meRole,
  initialWith,
}: {
  contacts: ChatContact[];
  meRole: "CENTER" | "DOCTOR";
  initialWith?: string;
}) {
  const ct = getPanelDict(useLocale()).chat;
  const [active, setActive] = React.useState<ChatContact | null>(null);
  const [convId, setConvId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const OtherIcon = meRole === "CENTER" ? Stethoscope : Building2;

  const filtered = query.trim()
    ? contacts.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : contacts;

  const load = React.useCallback(async (id: string) => {
    const res = await fetchMessagesAction(id);
    if (res.ok) setMessages(res.messages);
  }, []);
  const loadAdmin = React.useCallback(async () => {
    const res = await fetchAdminThreadMessagesAction();
    if (res.ok) setMessages(res.messages);
  }, []);

  // Poll the active conversation (partner) or the admin thread.
  React.useEffect(() => {
    if (!active) return;
    const isAdmin = active.kind === "admin";
    if (!isAdmin && !convId) return;
    const run = () => {
      void (isAdmin ? loadAdmin() : load(convId as string));
    };
    run();
    const t = setInterval(run, POLL_MS);
    return () => clearInterval(t);
  }, [active, convId, load, loadAdmin]);

  // Auto-scroll to the newest message.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function selectContact(c: ChatContact) {
    setError(null);
    setActive(c);
    setMessages([]);
    setConvId(null);
    if (c.kind === "admin") {
      // Admin thread operates on the current user's single thread — no convId.
      return;
    }
    if (c.conversationId) {
      setConvId(c.conversationId);
      return;
    }
    setLoading(true);
    const res = await openConversationAction(c.profileId);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setConvId(res.conversationId);
  }

  // Deep-link: auto-open the conversation passed via ?with=<profileId> (once).
  const autoOpened = React.useRef(false);
  React.useEffect(() => {
    if (autoOpened.current || !initialWith) return;
    const c = contacts.find((x) => x.profileId === initialWith);
    if (c) {
      autoOpened.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void selectContact(c);
    }
  }, [initialWith, contacts]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !active) return;
    const isAdmin = active.kind === "admin";
    if (!isAdmin && !convId) return;
    setInput("");
    setSending(true);
    // Optimistic
    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        senderId: "me",
        senderRole: meRole,
        content: text,
        hasFile: false,
        fileName: null,
        readAt: null,
        createdAt: new Date().toISOString(),
        mine: true,
      },
    ]);
    const res = isAdmin
      ? await sendToAdminAction(text)
      : await sendMessageAction(convId as string, text);
    setSending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (isAdmin) loadAdmin();
    else load(convId as string);
  }

  /** Attach a file: upload to private B2 via a presigned URL, then send it. */
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    const isAdmin = active.kind === "admin";
    if (!isAdmin && !convId) return;
    setError(null);
    setUploading(true);
    try {
      const contentType = file.type || "application/octet-stream";
      const signed = isAdmin
        ? await requestAdminChatUploadUrlAction({ fileName: file.name, contentType, size: file.size })
        : await requestChatUploadUrlAction({ conversationId: convId as string, fileName: file.name, contentType, size: file.size });
      if (!signed.ok) {
        setError(signed.error);
        return;
      }
      const put = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
      if (!put.ok) {
        setError(ct.fileError);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          senderId: "me",
          senderRole: meRole,
          content: "",
          hasFile: true,
          fileName: file.name,
          readAt: null,
          createdAt: new Date().toISOString(),
          mine: true,
        },
      ]);
      const payload = { key: signed.key, name: file.name };
      const res = isAdmin
        ? await sendToAdminAction("", payload)
        : await sendMessageAction(convId as string, "", payload);
      if (!res.ok) setError(res.error);
      else if (isAdmin) loadAdmin();
      else load(convId as string);
    } catch {
      setError(ct.fileError);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** Open a chat attachment via a short-lived, access-gated signed URL. */
  async function openFile(messageId: string) {
    if (messageId.startsWith("tmp-")) return; // optimistic, not persisted yet
    const res =
      active?.kind === "admin"
        ? await getAdminChatFileUrlAction(messageId)
        : await getChatFileUrlAction(messageId);
    if (!res.ok) return setError(res.error);
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Contact list */}
      <aside
        className={
          "w-full shrink-0 overflow-y-auto border-r border-slate-100 sm:w-72 " +
          (active ? "hidden sm:block" : "block")
        }
      >
        {contacts.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            Partnyorunuz yoxdur. Söhbət üçün əvvəlcə əməkdaşlıq qurun.
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Axtar…"
                  className="w-full rounded-full border border-slate-200 py-1.5 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none"
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">Nəticə tapılmadı.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((c) => (
              <li key={c.profileId}>
                <button
                  type="button"
                  onClick={() => selectContact(c)}
                  className={
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 " +
                    (active?.profileId === c.profileId ? "bg-brand-50" : "")
                  }
                >
                  <ChatAvatar url={c.avatarUrl} name={c.name} size={36} Icon={c.kind === "admin" ? LifeBuoy : OtherIcon} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 truncate font-semibold text-ink-900">
                        {c.kind === "admin" && <Pin className="h-3 w-3 shrink-0 text-brand-500" />}
                        {c.name}
                      </span>
                      {c.unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {c.preview ?? c.sub ?? "—"}
                    </span>
                  </span>
                </button>
              </li>
                ))}
              </ul>
            )}
          </>
        )}
      </aside>

      {/* Thread */}
      <section className={"flex min-w-0 flex-1 flex-col " + (active ? "flex" : "hidden sm:flex")}>
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-300">
            <MessageSquare className="h-10 w-10" />
            <p className="mt-2 text-sm text-slate-400">Söhbət seçin</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setActive(null);
                  setConvId(null);
                }}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 sm:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <ChatAvatar url={active.avatarUrl} name={active.name} size={32} Icon={active.kind === "admin" ? LifeBuoy : OtherIcon} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{active.name}</p>
                {active.sub && <p className="truncate text-xs text-slate-400">{active.sub}</p>}
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50/50 p-4">
              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              )}
              {!loading && messages.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  Hələ mesaj yoxdur. İlk mesajı yazın.
                </p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={"flex " + (m.mine ? "justify-end" : "justify-start")}>
                  <div
                    className={
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                      (m.mine
                        ? "bg-brand-600 text-white"
                        : "bg-white text-ink-900 ring-1 ring-slate-200")
                    }
                  >
                    {m.hasFile && (
                      <button
                        type="button"
                        onClick={() => openFile(m.id)}
                        className={
                          "mb-1 flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium " +
                          (m.mine ? "bg-white/15 hover:bg-white/25" : "bg-slate-100 hover:bg-slate-200")
                        }
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{m.fileName ?? "fayl"}</span>
                      </button>
                    )}
                    {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                    <span
                      className={
                        "mt-0.5 flex items-center justify-end gap-1 text-[10px] " +
                        (m.mine ? "text-white/70" : "text-slate-400")
                      }
                    >
                      {hhmm(m.createdAt)}
                      {m.mine &&
                        (m.readAt ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        ))}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="px-4 py-1 text-xs font-medium text-red-600">{error}</p>}

            <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={onPickFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || sending || (active?.kind === "partner" && !convId)}
                title={ct.attach}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={ct.write}
                className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim() || (active?.kind === "partner" && !convId)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
