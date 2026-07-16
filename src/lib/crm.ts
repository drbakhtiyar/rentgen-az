import "server-only";
import { prisma } from "@/lib/db";
import { RequestStatus } from "@/generated/prisma/enums";
import { parseHours, slotsForDate, type WeeklyHours, type DayKey, ymdToDayKey } from "@/lib/hours";

/**
 * CRM scheduling helpers for centers (crm.rentgen.az).
 *
 * There is no separate slot table. Working days/hours come from the center's
 * public profile (`hours`). Each service the center offers has a duration
 * (`CenterService.durationMin`); booking a service at time T blocks the range
 * [T, T+duration). A start time is free for a new booking if that whole range
 * fits inside working hours and overlaps fewer than `slotCapacity` existing
 * appointments. An appointment counts as occupying as soon as it is created
 * (status NEW) — so an unconfirmed booking already shows the time as busy; once
 * the center confirms (CONTACTED+) it stays occupied.
 */

const OCCUPYING: RequestStatus[] = [
  RequestStatus.NEW,
  RequestStatus.CONTACTED,
  RequestStatus.COMPLETED,
];

const DEFAULT_DURATION = 30;

type SlotCenter = {
  hours: unknown;
  slotMinutes: number;
  slotCapacity: number;
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** UTC bounds [start, end) for a Baku calendar day "YYYY-MM-DD". */
export function bakuDayBounds(ymd: string): { start: Date; end: Date } {
  const start = new Date(`${ymd}T00:00:00+04:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** "HH:mm" (Baku) for a Date — where an appointment sits on the day grid. */
export function bakuSlotKey(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baku",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

/** "YYYY-MM-DD" (Baku) for a Date. */
export function bakuYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Shift a "YYYY-MM-DD" date by n days (timezone-safe). */
export function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/** Monday (week start) of the week containing "YYYY-MM-DD". */
export function mondayOf(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  const back = dow === 0 ? 6 : dow - 1;
  return shiftYmd(ymd, -back);
}

/** serviceSlug → durationMin for a center (from its CenterService rows). */
export async function getCenterServiceDurations(
  centerId: string,
): Promise<Record<string, number>> {
  const rows = await prisma.centerService.findMany({
    where: { centerId },
    select: { durationMin: true, service: { select: { slug: true } } },
  });
  const map: Record<string, number> = {};
  for (const r of rows) map[r.service.slug] = r.durationMin || DEFAULT_DURATION;
  return map;
}

type Interval = { startMin: number; endMin: number };

/** Occupied time ranges (minutes-of-day, Baku) for a center on a day. */
async function getOccupiedIntervals(
  centerId: string,
  ymd: string,
  fallbackDur: number,
): Promise<Interval[]> {
  const { start, end } = bakuDayBounds(ymd);
  const [rows, durations] = await Promise.all([
    prisma.appointmentRequest.findMany({
      where: {
        centerId,
        status: { in: OCCUPYING },
        preferredDate: { gte: start, lt: end },
      },
      select: { preferredDate: true, serviceSlug: true },
    }),
    getCenterServiceDurations(centerId),
  ]);
  const out: Interval[] = [];
  for (const r of rows) {
    if (!r.preferredDate) continue;
    const startMin = toMinutes(bakuSlotKey(r.preferredDate));
    const dur = (r.serviceSlug && durations[r.serviceSlug]) || fallbackDur;
    out.push({ startMin, endMin: startMin + dur });
  }
  return out;
}

/**
 * Free start times ("HH:mm") for booking a service of `durationMin` on `ymd`.
 * Considers working hours, service duration (range must fit before closing),
 * capacity and existing bookings. Past times for today are excluded.
 */
export async function getFreeStartsForService(
  center: SlotCenter,
  centerId: string,
  ymd: string,
  durationMin: number,
): Promise<string[]> {
  const week: WeeklyHours | null = parseHours(center.hours);
  if (!week) return [];
  const dayKey: DayKey = ymdToDayKey(ymd);
  const day = week[dayKey];
  if (!day) return [];
  const closeMin = toMinutes(day.close);
  const step = center.slotMinutes || DEFAULT_DURATION;
  const dur = durationMin || DEFAULT_DURATION;
  const grid = slotsForDate(week, ymd, step);
  if (grid.length === 0) return [];
  const cap = Math.max(1, center.slotCapacity || 1);
  const occupied = await getOccupiedIntervals(centerId, ymd, step);
  return grid.filter((t0) => {
    const t = toMinutes(t0);
    if (t + dur > closeMin) return false; // range must end before closing
    const overlaps = occupied.filter(
      (iv) => t < iv.endMin && t + dur > iv.startMin,
    ).length;
    return overlaps < cap;
  });
}

export type DayAppointment = {
  id: string;
  time: string; // "HH:mm" Baku, or "" if no preferredDate
  durationMin: number;
  name: string;
  phone: string;
  serviceSlug: string | null;
  status: RequestStatus;
  note: string | null;
  doctorName: string | null;
  patientId: string | null;
};

/** Appointments for a center on a Baku day, ordered by time, with durations. */
export async function getCenterDayAppointments(
  centerId: string,
  ymd: string,
): Promise<DayAppointment[]> {
  const { start, end } = bakuDayBounds(ymd);
  const [rows, durations] = await Promise.all([
    prisma.appointmentRequest.findMany({
      where: { centerId, preferredDate: { gte: start, lt: end } },
      include: { doctor: { select: { firstName: true, lastName: true } } },
      orderBy: { preferredDate: "asc" },
    }),
    getCenterServiceDurations(centerId),
  ]);
  return rows.map((r) => ({
    id: r.id,
    time: r.preferredDate ? bakuSlotKey(r.preferredDate) : "",
    durationMin: (r.serviceSlug && durations[r.serviceSlug]) || DEFAULT_DURATION,
    name: r.name,
    phone: r.phone,
    serviceSlug: r.serviceSlug,
    status: r.status,
    note: r.note,
    doctorName: r.doctor ? `${r.doctor.firstName} ${r.doctor.lastName}`.trim() : null,
    patientId: r.patientId,
  }));
}

/** Appointments for the 7-day week starting at `mondayYmd`, bucketed by day. */
export async function getCenterWeekAppointments(
  centerId: string,
  mondayYmd: string,
): Promise<{ ymd: string; appts: DayAppointment[] }[]> {
  const start = new Date(`${mondayYmd}T00:00:00+04:00`);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [rows, durations] = await Promise.all([
    prisma.appointmentRequest.findMany({
      where: { centerId, preferredDate: { gte: start, lt: end } },
      include: { doctor: { select: { firstName: true, lastName: true } } },
      orderBy: { preferredDate: "asc" },
    }),
    getCenterServiceDurations(centerId),
  ]);
  const days: { ymd: string; appts: DayAppointment[] }[] = [];
  for (let i = 0; i < 7; i++) days.push({ ymd: shiftYmd(mondayYmd, i), appts: [] });
  const byYmd = new Map(days.map((d) => [d.ymd, d]));
  for (const r of rows) {
    if (!r.preferredDate) continue;
    const bucket = byYmd.get(bakuYmd(r.preferredDate));
    if (!bucket) continue;
    bucket.appts.push({
      id: r.id,
      time: bakuSlotKey(r.preferredDate),
      durationMin: (r.serviceSlug && durations[r.serviceSlug]) || DEFAULT_DURATION,
      name: r.name,
      phone: r.phone,
      serviceSlug: r.serviceSlug,
      status: r.status,
      note: r.note,
      doctorName: r.doctor ? `${r.doctor.firstName} ${r.doctor.lastName}`.trim() : null,
      patientId: r.patientId,
    });
  }
  return days;
}

export type CrmPatient = {
  key: string; // phone (identity)
  name: string;
  phone: string;
  patientId: string | null; // null = not registered in our system (files disabled)
  visits: number;
  lastVisit: Date | null;
  nextVisit: Date | null;
  lastStatus: RequestStatus;
};

/**
 * A center's patient base, derived from its appointment history and keyed by
 * phone. Sorted by most-recent activity. Patients with `patientId` are
 * registered in our system (full features); null = manually-added / external.
 */
export async function getCenterPatients(centerId: string): Promise<CrmPatient[]> {
  const rows = await prisma.appointmentRequest.findMany({
    where: { centerId },
    select: {
      name: true,
      phone: true,
      patientId: true,
      preferredDate: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  const now = new Date();
  const map = new Map<string, CrmPatient>();
  for (const r of rows) {
    let p = map.get(r.phone);
    if (!p) {
      p = {
        key: r.phone,
        name: r.name,
        phone: r.phone,
        patientId: r.patientId,
        visits: 0,
        lastVisit: null,
        nextVisit: null,
        lastStatus: r.status,
      };
      map.set(r.phone, p);
    }
    p.visits += 1;
    if (r.patientId && !p.patientId) p.patientId = r.patientId;
    const when = r.preferredDate ?? r.createdAt;
    if (when && (!p.lastVisit || when > p.lastVisit)) p.lastVisit = when;
    if (r.preferredDate && r.preferredDate > now) {
      if (!p.nextVisit || r.preferredDate < p.nextVisit) p.nextVisit = r.preferredDate;
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => (b.lastVisit?.getTime() ?? 0) - (a.lastVisit?.getTime() ?? 0),
  );
}

/** Quick counters for the CRM overview. */
export async function getCrmOverview(centerId: string, todayYmd: string) {
  const { start, end } = bakuDayBounds(todayYmd);
  const [todayCount, upcomingCount, newCount, patients] = await Promise.all([
    prisma.appointmentRequest.count({
      where: { centerId, preferredDate: { gte: start, lt: end } },
    }),
    prisma.appointmentRequest.count({
      where: { centerId, preferredDate: { gte: end }, status: { in: OCCUPYING } },
    }),
    prisma.appointmentRequest.count({ where: { centerId, status: RequestStatus.NEW } }),
    prisma.appointmentRequest.findMany({
      where: { centerId },
      select: { phone: true },
      distinct: ["phone"],
    }),
  ]);
  return { todayCount, upcomingCount, newCount, totalPatients: patients.length };
}
