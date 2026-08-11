import type { Metadata } from "next";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { AdminChatInterface } from "@/components/chat/admin-chat-interface";
import { requireRole } from "@/lib/auth/rbac";
import { getAdminThreads } from "@/lib/admin-chat";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "WhatsApp söhbətləri",
  path: "/admin/whatsapp-sohbetler",
  noIndex: true,
});

/**
 * WhatsApp yazışmaları — panel söhbətlərindən AYRICA (istifadəçi qərarı,
 * 2026-08-12). Botun bütün dialoqları (📲 gələn / 🤖 bot) burada görünür;
 * cavab yazanda 24 saat pəncərəsi daxilində WhatsApp-a göndərilir
 * (adminSendToUserAction körpüsü).
 */
export default async function AdminWhatsappChatPage() {
  const admin = await requireRole("ADMIN", "/admin/whatsapp-sohbetler");
  const threads = await getAdminThreads("whatsapp");

  return (
    <AdminShell title="WhatsApp söhbətləri" userName={admin.phone}>
      <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
        📲 gələn mesajlar · 🤖 botun cavabları. Buradan yazdığınız cavab (son mesajdan
        24 saat ərzində) birbaşa WhatsApp-a göndərilir; pəncərə bitibsə sistem
        xəbərdarlıq qeydi düşür.
      </p>
      <AdminChatInterface threads={threads} />
    </AdminShell>
  );
}
