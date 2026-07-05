/**
 * Structured weekly working hours for centers + live open/closed status.
 * Times are "HH:mm" in Azerbaijan local time (Asia/Baku, UTC+4, no DST).
 * Pure module (no server-only) so the status can be computed on the client.
 */

export type DayHours = { open: string; close: string } | null; // null = closed
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type WeeklyHours = Record<DayKey, DayHours>;

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS_AZ: Record<DayKey, string> = {
  mon: "B.e",
  tue: "Ç.a",
  wed: "Ç",
  thu: "C.a",
  fri: "Cümə",
  sat: "Şənbə",
  sun: "Bazar",
};

const DAY_LABELS_FULL_AZ: Record<DayKey, string> = {
  mon: "Bazar ertəsi",
  tue: "Çərşənbə axşamı",
  wed: "Çərşənbə",
  thu: "Cümə axşamı",
  fri: "Cümə",
  sat: "Şənbə",
  sun: "Bazar",
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Empty week (all days closed). */
export function emptyWeek(): WeeklyHours {
  return { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };
}

/** Safely parse an unknown JSON value from the DB into WeeklyHours (or null). */
export function parseHours(value: unknown): WeeklyHours | null {
  if (!value || typeof value !== "object") return null;
  const src = value as Record<string, unknown>;
  const out = emptyWeek();
  let any = false;
  for (const key of DAY_KEYS) {
    const d = src[key];
    if (d && typeof d === "object") {
      const { open, close } = d as { open?: unknown; close?: unknown };
      if (
        typeof open === "string" &&
        typeof close === "string" &&
        TIME_RE.test(open) &&
        TIME_RE.test(close)
      ) {
        out[key] = { open, close };
        any = true;
      }
    }
  }
  return any ? out : null;
}

/**
 * Human-readable summary, grouping consecutive days with identical hours.
 * e.g. "B.e–Cümə 09:00–19:00, Şənbə 09:00–15:00".
 */
export function formatHoursSummary(h: WeeklyHours | null): string {
  if (!h) return "";
  const groups: { days: DayKey[]; open: string; close: string }[] = [];
  for (const key of DAY_KEYS) {
    const d = h[key];
    if (!d) continue;
    const last = groups[groups.length - 1];
    if (last && last.open === d.open && last.close === d.close && isAdjacent(last.days[last.days.length - 1], key)) {
      last.days.push(key);
    } else {
      groups.push({ days: [key], open: d.open, close: d.close });
    }
  }
  if (groups.length === 0) return "";
  return groups
    .map((g) => {
      const label =
        g.days.length === 1
          ? DAY_LABELS_AZ[g.days[0]]
          : `${DAY_LABELS_AZ[g.days[0]]}–${DAY_LABELS_AZ[g.days[g.days.length - 1]]}`;
      return `${label} ${g.open}–${g.close}`;
    })
    .join(", ");
}

function isAdjacent(a: DayKey, b: DayKey): boolean {
  return DAY_KEYS.indexOf(b) === DAY_KEYS.indexOf(a) + 1;
}

/** Full per-day rows for a detail-page table (only days with hours). */
export function hoursRows(h: WeeklyHours | null): { label: string; text: string; key: DayKey }[] {
  if (!h) return [];
  return DAY_KEYS.map((key) => ({
    key,
    label: DAY_LABELS_FULL_AZ[key],
    text: h[key] ? `${h[key]!.open}–${h[key]!.close}` : "Bağlı",
  }));
}

// ------------------------- Live open/closed status -------------------------

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

/** Current weekday + minutes-of-day in Azerbaijan time. */
export function nowInBaku(now: Date = new Date()): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baku",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { day: WEEKDAY_TO_KEY[wd] ?? "mon", minutes: hh * 60 + mm };
}

/** Today's date in Azerbaijan as "YYYY-MM-DD". */
export function bakuTodayYmd(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

const WD_INDEX_TO_KEY: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Weekday key for a "YYYY-MM-DD" date (timezone-safe). */
export function ymdToDayKey(ymd: string): DayKey {
  const [y, m, d] = ymd.split("-").map(Number);
  return WD_INDEX_TO_KEY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/**
 * Bookable time slots for a given date, from the center's hours.
 * Past slots for "today" (Baku) are excluded.
 */
export function slotsForDate(
  week: WeeklyHours | null,
  ymd: string,
  stepMin = 30,
  now: Date = new Date(),
): string[] {
  if (!week || !ymd) return [];
  const day = week[ymdToDayKey(ymd)];
  if (!day) return [];
  const open = toMinutes(day.open);
  const close = toMinutes(day.close);
  if (close <= open) return [];
  const isToday = ymd === bakuTodayYmd(now);
  const nowMin = isToday ? nowInBaku(now).minutes + 30 : -1; // 30-min booking buffer
  const out: string[] = [];
  for (let t = open; t + stepMin <= close; t += stepMin) {
    if (t < nowMin) continue;
    const h = String(Math.floor(t / 60)).padStart(2, "0");
    const m = String(t % 60).padStart(2, "0");
    out.push(`${h}:${m}`);
  }
  return out;
}

export type OpenStatus =
  | { state: "open"; closesAt: string }
  | { state: "closing"; minutesToClose: number; closesAt: string }
  | { state: "opens_later"; opensAt: string }
  | { state: "closed" };

/** Compute live open/closed status for a center, in Azerbaijan time. */
export function computeOpenStatus(
  h: WeeklyHours | null,
  now: Date = new Date(),
): OpenStatus | null {
  if (!h) return null;
  const { day, minutes } = nowInBaku(now);
  const today = h[day];
  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (close > open && minutes >= open && minutes < close) {
      const minutesToClose = close - minutes;
      if (minutesToClose <= 60) {
        return { state: "closing", minutesToClose, closesAt: today.close };
      }
      return { state: "open", closesAt: today.close };
    }
    if (minutes < open) {
      return { state: "opens_later", opensAt: today.open };
    }
  }
  return { state: "closed" };
}
