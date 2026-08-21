import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";
import { formatDateAz } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { MarkReadButton } from "./mark-read";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Yazılı sorğular",
  path: "/admin/sorgular",
  noIndex: true,
});

/** Əlaqə formasının OTP-təsdiqli sorğuları (2026-08-22). */
export default async function AdminContactMessagesPage() {
  const admin = await requireRole("ADMIN", "/admin/sorgular");
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const unread = messages.filter((m) => !m.read).length;

  return (
    <AdminShell title="Yazılı sorğular" userName={admin.phone}>
      <p className="mb-4 text-sm text-slate-500">
        Əlaqə formasından gələn təsdiqlənmiş sorğular
        {unread > 0 && (
          <span className="ml-2 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
            {unread} oxunmamış
          </span>
        )}
      </p>

      {messages.length === 0 ? (
        <Card className="p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-semibold text-ink-900">Hələ sorğu yoxdur.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={`p-5 ${m.read ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">{m.name}</span>
                  <a href={`tel:${m.phone}`} className="text-sm text-brand-600 hover:underline">
                    {formatPhoneDisplay(m.phone)}
                  </a>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {m.subject}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatDateAz(m.createdAt)}</span>
                  {!m.read && <MarkReadButton id={m.id} />}
                </div>
              </div>
              {m.message !== m.subject && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {m.message}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
