import "server-only";
import { prisma } from "./db";
import { Prisma } from "@/generated/prisma/client";

/**
 * Giriş axınları analitikası — REN-41.
 *
 * Bütün metriklər YALNIZ aqreqatdır (PII sızmır). Sorğular mövcud Prisma
 * modellərindən oxunur; heç bir auth/RBAC məntiqi dəyişdirilmir.
 *
 * ── Metrik tərifləri (data definitions) ──────────────────────────────────
 *  • "OTP sorğusu (unikal nömrə)"  — verilən pəncərədə ən azı bir OTP kodu
 *      istəmiş fərqli telefon nömrələri (OTPCode.phone, createdAt-ə görə).
 *  • "OTP göndərildi"              — göndərilmiş OTP kodlarının ümumi sayı
 *      (təkrar göndərişlər daxil).
 *  • "Uğurlu giriş"                — pəncərədə uğurla giriş edən fərqli
 *      istifadəçilər (User.lastLoginAt). ADMIN xaric (admin ayrı gizli
 *      link ilə girir). Qeyd: lastLoginAt üzərinə yazılır, ona görə bu
 *      "pəncərədə aktiv giriş edən istifadəçi" deməkdir.
 *  • "Aktiv/təsdiqlənmiş mərkəz"   — CenterProfile.status = APPROVED.
 *  • "Təsdiq müddəti"              — mərkəzin ilk `center:APPROVED` admin
 *      jurnalı (AdminActionLog) ilə CenterProfile.createdAt arasındakı fərq.
 *  • "Baxış / Əlaqə"               — CenterEvent type=view / (call|whatsapp).
 *  • "Müraciət"                    — AppointmentRequest sətri (booking).
 *
 * Bilinən boşluq: pasiyent AXTARIŞ addımı hələ instrumentləşdirilməyib
 * (event yazılmır), ona görə "axtarış → mərkəz" konversiyası bu paneldə
 * mərkəz BAXIŞI-ndan başlayır. Bax: REN-41 alt-tapşırığı (search tracking).
 */

/** Window in days; `null` = bütün dövr (all-time). */
export type WindowDays = number | null;

function sinceSql(windowDays: WindowDays): Prisma.Sql {
  return windowDays == null
    ? Prisma.sql`timestamp '1970-01-01'`
    : Prisma.sql`now() - make_interval(days => ${windowDays})`;
}

// ── 1. Pasiyent / giriş OTP funnel ─────────────────────────────────────────
export type LoginFunnel = {
  windowDays: WindowDays;
  otpPhones: number; // unikal nömrə (OTP sorğusu)
  otpSends: number; // ümumi göndərilən kod
  logins: number; // uğurlu giriş (ADMIN xaric)
  newPatients: number; // yeni pasiyent profili
  requestToLoginPct: number | null; // logins / otpPhones
};

export async function getLoginFunnel(windowDays: WindowDays): Promise<LoginFunnel> {
  const since = sinceSql(windowDays);
  const rows = await prisma.$queryRaw<
    Array<{ otpPhones: number; otpSends: number; logins: number; newPatients: number }>
  >`
    select
      (select count(distinct phone)::int from "OTPCode" where "createdAt" >= ${since}) as "otpPhones",
      (select count(*)::int              from "OTPCode" where "createdAt" >= ${since}) as "otpSends",
      (select count(*)::int              from "User"    where "lastLoginAt" >= ${since} and role <> 'ADMIN') as "logins",
      (select count(*)::int              from "PatientProfile" where "createdAt" >= ${since}) as "newPatients"
  `;
  const r = rows[0] ?? { otpPhones: 0, otpSends: 0, logins: 0, newPatients: 0 };
  return {
    windowDays,
    ...r,
    requestToLoginPct: r.otpPhones > 0 ? (r.logins / r.otpPhones) * 100 : null,
  };
}

/** Giriş edən istifadəçilərin rol üzrə bölgüsü (ADMIN xaric). */
export type LoginByRole = { role: string; count: number };
export async function getLoginsByRole(windowDays: WindowDays): Promise<LoginByRole[]> {
  const since = sinceSql(windowDays);
  const rows = await prisma.$queryRaw<Array<{ role: string; count: number }>>`
    select role::text as role, count(*)::int as count
    from "User"
    where "lastLoginAt" >= ${since} and role <> 'ADMIN'
    group by role
    order by count desc
  `;
  return rows;
}

// ── 2. Mərkəz qeydiyyat → təsdiq ───────────────────────────────────────────
export type ApprovalStats = {
  windowDays: WindowDays;
  registered: number; // pəncərədə qeydiyyatdan keçən mərkəzlər
  total: number; // ümumi mərkəz (bütün dövr)
  pending: number;
  approved: number;
  deactivated: number;
  approvalRatePct: number | null; // approved / total (bütün dövr)
  avgHours: number | null; // orta təsdiq müddəti (saat)
  medianHours: number | null; // median təsdiq müddəti (saat)
};

export async function getApprovalStats(windowDays: WindowDays): Promise<ApprovalStats> {
  const since = sinceSql(windowDays);
  const [registered, total, pending, approved, deactivated] = await Promise.all([
    prisma.centerProfile.count({ where: { createdAt: { gte: windowSince(windowDays) } } }),
    prisma.centerProfile.count(),
    prisma.centerProfile.count({ where: { status: "PENDING" } }),
    prisma.centerProfile.count({ where: { status: "APPROVED" } }),
    prisma.centerProfile.count({ where: { status: "DEACTIVATED" } }),
  ]);

  // Təsdiq müddəti: hər mərkəzin İLK center:APPROVED admin jurnalı ilə
  // qeydiyyat tarixi arasındakı fərq. (Yalnız qeydiyyatdan sonra baş verən
  // təsdiqlər — mənfi fərqlər kənara atılır.)
  const appr = await prisma.$queryRaw<
    Array<{ avgHours: number | null; medianHours: number | null }>
  >`
    with first_appr as (
      select "targetId" as cid, min("createdAt") as approved_at
      from "AdminActionLog"
      where action = 'center:APPROVED' and "targetId" is not null
        and "createdAt" >= ${since}
      group by "targetId"
    )
    select
      avg(extract(epoch from (fa.approved_at - c."createdAt")) / 3600)::float8 as "avgHours",
      (percentile_cont(0.5) within group (
        order by extract(epoch from (fa.approved_at - c."createdAt")) / 3600
      ))::float8 as "medianHours"
    from first_appr fa
    join "CenterProfile" c on c.id = fa.cid
    where fa.approved_at >= c."createdAt"
  `;

  return {
    windowDays,
    registered,
    total,
    pending,
    approved,
    deactivated,
    approvalRatePct: total > 0 ? (approved / total) * 100 : null,
    avgHours: appr[0]?.avgHours ?? null,
    medianHours: appr[0]?.medianHours ?? null,
  };
}

// ── 3. Kəşf → əlaqə / booking konversiyası ─────────────────────────────────
export type DiscoveryFunnel = {
  windowDays: WindowDays;
  views: number; // mərkəz baxışları
  contacts: number; // zəng + whatsapp
  requests: number; // müraciətlər (booking)
  completed: number; // tamamlanmış müraciətlər
  viewToContactPct: number | null;
  viewToRequestPct: number | null;
};

export async function getDiscoveryFunnel(windowDays: WindowDays): Promise<DiscoveryFunnel> {
  const since = sinceSql(windowDays);
  const rows = await prisma.$queryRaw<
    Array<{ views: number; contacts: number; requests: number; completed: number }>
  >`
    select
      (select count(*)::int from "CenterEvent" where type = 'view' and "createdAt" >= ${since}) as "views",
      (select count(*)::int from "CenterEvent" where type in ('call','whatsapp') and "createdAt" >= ${since}) as "contacts",
      (select count(*)::int from "AppointmentRequest" where "createdAt" >= ${since}) as "requests",
      (select count(*)::int from "AppointmentRequest" where status = 'COMPLETED' and "createdAt" >= ${since}) as "completed"
  `;
  const r = rows[0] ?? { views: 0, contacts: 0, requests: 0, completed: 0 };
  return {
    windowDays,
    ...r,
    viewToContactPct: r.views > 0 ? (r.contacts / r.views) * 100 : null,
    viewToRequestPct: r.views > 0 ? (r.requests / r.views) * 100 : null,
  };
}

// prisma count üçün JS tərəfli "since" (raw SQL-dən fərqli olaraq Date lazımdır)
function windowSince(windowDays: WindowDays): Date {
  if (windowDays == null) return new Date(0);
  return new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
}

/** Panel üçün bütün metrikləri bir pəncərə üçün topla. */
export async function getAccessAnalytics(windowDays: WindowDays) {
  const [login, loginsByRole, approval, discovery] = await Promise.all([
    getLoginFunnel(windowDays),
    getLoginsByRole(windowDays),
    getApprovalStats(windowDays),
    getDiscoveryFunnel(windowDays),
  ]);
  return { login, loginsByRole, approval, discovery };
}
