import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { pacsConfigured, pacsOpenUrl } from "@/lib/pacs";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * /admin/pacs/ac?study=<StudyInstanceUID | *>
 * Mints a 5-minute signed link and bounces the admin to pacs.rentgen.az (OHIF).
 * "*" = full PACS session (study list + Orthanc Explorer at /orthanc/ui/app/).
 */
export async function GET(req: NextRequest) {
  const user = await requireRole("ADMIN", "/admin/pacs");
  if (!pacsConfigured()) return NextResponse.redirect(new URL("/admin/pacs", req.url));
  const study = (req.nextUrl.searchParams.get("study") ?? "").trim();
  if (!study || (study !== "*" && !/^[0-9.]{5,128}$/.test(study))) {
    return NextResponse.redirect(new URL("/admin/pacs", req.url));
  }
  await prisma.adminActionLog
    .create({
      data: {
        adminId: user.id,
        action: "pacs:open",
        targetType: "PacsStudy",
        targetId: study,
        meta: { ua: req.headers.get("user-agent")?.slice(0, 200) ?? null },
      },
    })
    .catch(() => null);
  return NextResponse.redirect(pacsOpenUrl({ sub: user.id, role: "admin", study, ttlSec: 300 }));
}
