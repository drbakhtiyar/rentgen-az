import { redirect } from "next/navigation";

// The analytics dashboard was merged into the admin overview (/admin) — the
// actionable pending-centers panel first, then the İcmal totals, then the
// access-flow analytics. This route redirects so old links keep working.
export default function AnalyticsRedirect(): never {
  redirect("/admin");
}
