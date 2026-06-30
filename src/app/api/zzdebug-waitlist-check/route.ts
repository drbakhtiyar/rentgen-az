import { prisma } from "@/lib/db";

// Temporary verification endpoint for the WaitlistSignup migration. Remove after confirming.
export async function GET() {
  const count = await prisma.waitlistSignup.count();
  return Response.json({ ok: true, count });
}
