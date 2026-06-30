import type { Metadata } from "next";
import { Users, ShieldOff, Download } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { StatCard, EmptyState, Panel } from "@/components/dashboard/widgets";
import { BlockToggle } from "@/components/admin/controls";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pasiyentlər",
  path: "/admin/pasiyentler",
  noIndex: true,
});

async function getPatients(q?: string) {
  try {
    // Profile-based (not role-based): a person who is also a doctor/center but
    // has a patient profile still shows here. Phone is the unique identity.
    const where: Prisma.UserWhereInput = q
      ? {
          patientProfile: { isNot: null },
          OR: [
            { phone: { contains: q } },
            {
              patientProfile: {
                is: {
                  OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : { patientProfile: { isNot: null } };
    return await prisma.user.findMany({
      where,
      include: { patientProfile: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    return [];
  }
}

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/pasiyentler");
  const { q } = await searchParams;
  const patients = await getPatients(q);

  const total = patients.length;
  const blockedCount = patients.filter((u) => u.isBlocked).length;

  return (
    <AdminShell title="Pasiyentlər" userName={admin.phone}>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Ümumi pasiyent sayı" value={total} icon={<Users />} />
        <StatCard
          label="Bloklanmış say"
          value={blockedCount}
          icon={<ShieldOff />}
          tone="amber"
        />
      </div>

      <form
        action="/admin/pasiyentler"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Ad və ya telefon üzrə axtar"
          className="max-w-xs"
        />
        <Button type="submit">Axtar</Button>
      </form>

      <Panel
        title="Pasiyentlər"
        action={
          <a
            href="/admin/export/pasiyentler"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-ink-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> CSV yüklə
          </a>
        }
      >
        {patients.length > 0 ? (
          <div className="space-y-3">
            {patients.map((u) => {
              const name =
                [u.patientProfile?.firstName, u.patientProfile?.lastName]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "Adsız";
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink-900">{name}</p>
                      {u.isBlocked && <Badge tone="red">Bloklanıb</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {[
                        formatPhoneDisplay(u.phone),
                        u.patientProfile?.city,
                        `Qeydiyyat: ${formatDateAz(u.createdAt)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <BlockToggle userId={u.id} blocked={u.isBlocked} />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Users />}
            title="Pasiyent tapılmadı"
            description="Hələ qeydiyyatdan keçmiş pasiyent yoxdur."
          />
        )}
      </Panel>
    </AdminShell>
  );
}
