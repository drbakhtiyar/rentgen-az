import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/rbac";
import { pacsConfigured, mintPacsToken } from "@/lib/pacs";
import { pacsScopeForUser } from "@/lib/pacs-scope";
import { dashboardPathForRole } from "@/lib/auth/rbac";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PACS single sign-on: pacs.rentgen.az bounces anonymous visitors here
 * (?next=<path on pacs>). We reuse the normal rentgen.az login (same phone,
 * same OTP), compute what this person may see, and send them back with a
 * 2-minute signed token → pacs.rentgen.az/open?t=… → session cookie → OHIF.
 */
export async function GET(req: NextRequest) {
  const rawNext = req.nextUrl.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const user = await requireUser(`/pacs/giris?next=${encodeURIComponent(next)}`);
  if (!pacsConfigured()) return NextResponse.redirect(new URL(dashboardPathForRole(user.role), req.url));

  const scope = await pacsScopeForUser(user);
  if (!scope) {
    // No PACS access for this role (e.g. OPERATOR) → back to their dashboard
    return NextResponse.redirect(new URL(dashboardPathForRole(user.role), req.url));
  }

  await prisma.adminActionLog
    .create({
      data: {
        adminId: user.id,
        action: "pacs:sso",
        targetType: "PacsScope",
        targetId: "study" in scope ? "*" : scope.labels.join(","),
        meta: { role: scope.role, next, ua: req.headers.get("user-agent")?.slice(0, 200) ?? null },
      },
    })
    .catch(() => null);

  const token = mintPacsToken({
    sub: user.id,
    role: scope.role,
    name: scope.name,
    study: "study" in scope ? scope.study : undefined,
    labels: "labels" in scope ? scope.labels : undefined,
    dest: next,
    ttlSec: 120,
  });
  return NextResponse.redirect(`${env.pacs.url}/open?t=${token}`);
}
