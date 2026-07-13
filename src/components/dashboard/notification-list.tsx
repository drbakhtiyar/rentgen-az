"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Inbox,
  UserPlus,
  FileDown,
  Handshake,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Star,
  PhoneCall,
  Megaphone,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/widgets";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import { useLocale } from "@/components/locale-context";
import { getPanelDict } from "@/lib/i18n-panel";
import type { Locale } from "@/lib/i18n";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string | Date;
};

const ICONS: Record<string, React.ReactNode> = {
  NEW_REQUEST: <UserPlus className="h-4 w-4" />,
  RESULT_READY: <FileDown className="h-4 w-4" />,
  PARTNER_REQUEST: <Handshake className="h-4 w-4" />,
  PARTNER_ACCEPTED: <CheckCircle2 className="h-4 w-4" />,
  PARTNER_REJECTED: <XCircle className="h-4 w-4" />,
  ADMIN_MESSAGE: <MessageSquare className="h-4 w-4" />,
  PATIENT_UPDATED: <Clock className="h-4 w-4" />,
  STATUS_UPDATE: <PhoneCall className="h-4 w-4" />,
  REVIEW_REPLY: <MessageSquare className="h-4 w-4" />,
  REVIEW_INVITE: <Star className="h-4 w-4" />,
  NEW_MESSAGE: <MessageSquare className="h-4 w-4" />,
  CENTER_BROADCAST: <Megaphone className="h-4 w-4" />,
};

function timeAgo(d: string | Date, locale: Locale, nt: PanelNotif): string {
  const t = new Date(d).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return nt.now;
  if (m < 60) return `${m} ${nt.minAgo}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${nt.hourAgo}`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} ${nt.dayAgo}`;
  return new Date(d).toLocaleDateString(locale === "ru" ? "ru" : "az");
}

type PanelNotif = ReturnType<typeof getPanelDict>["notif"];

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const locale = useLocale();
  const nt = getPanelDict(locale).notif;
  const [pending, startTransition] = React.useTransition();
  const hasUnread = items.some((n) => !n.read);

  function open(n: NotificationItem) {
    startTransition(async () => {
      if (!n.read) await markNotificationReadAction(n.id);
      if (n.link) router.push(n.link);
      else router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell />}
        title={nt.empty}
        description={nt.emptyBody}
      />
    );
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={markAll}
            disabled={pending}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            {nt.markAll}
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => open(n)}
              disabled={pending}
              className={
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors " +
                (n.read
                  ? "border-slate-100 bg-white hover:bg-slate-50"
                  : "border-brand-200 bg-brand-50/60 hover:bg-brand-50")
              }
            >
              <span
                className={
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
                  (n.read ? "bg-slate-100 text-slate-500" : "bg-brand-100 text-brand-700")
                }
              >
                {ICONS[n.type] ?? <Inbox className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900">{n.title}</span>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </span>
                {n.body && <span className="mt-0.5 block text-sm text-slate-600">{n.body}</span>}
                <span className="mt-1 block text-xs text-slate-400">{timeAgo(n.createdAt, locale, nt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
