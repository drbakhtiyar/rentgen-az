import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The AI helper now lives inside CRM Söhbətlər. Keep the old link working. */
export default function CrmAiRedirect() {
  redirect("/crm/chat");
}
