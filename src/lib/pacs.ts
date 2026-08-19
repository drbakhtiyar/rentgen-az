import "server-only";
import { createHmac } from "node:crypto";
import { env } from "./env";

/**
 * PACS bridge — pacs.rentgen.az (Orthanc + OHIF behind a Caddy forward_auth gate;
 * see infra/pacs/). Two things live here:
 *   1. mintPacsToken / pacsOpenUrl — HMAC-signed, short-lived "open this study" links.
 *      The PACS auth service turns them into a scoped session cookie.
 *   2. orthanc()/listPacsStudies — server-to-server reads with the Orthanc admin
 *      credentials (listing studies for the admin page). Never call from the client.
 */

export type PacsRole = "admin" | "doctor" | "center" | "patient";

/** What a rentgen.az user may see in the PACS. Orthanc labels: center-<id> | doctor-<id> | patient-<id>. */
export type PacsScope =
  | { role: PacsRole; name: string; study: "*" }
  | { role: PacsRole; name: string; labels: string[] };

/** Label helpers — keep in sync with infra/pacs/orthanc/label-origin.lua (gw-<centerId> → center-<centerId>). */
export const pacsLabel = {
  center: (centerId: string) => `center-${centerId}`,
  doctor: (doctorId: string) => `doctor-${doctorId}`,
  patient: (userId: string) => `patient-${userId}`,
  archive: "archive",
};

export function pacsConfigured(): boolean {
  return Boolean(env.pacs.sharedSecret);
}
export function pacsOrthancConfigured(): boolean {
  return pacsConfigured() && Boolean(env.pacs.orthancUser && env.pacs.orthancPass);
}

const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/**
 * study = StudyInstanceUID, or "*" for full access (admin only); or labels = every
 * study carrying any of these Orthanc labels. dest = path on pacs.rentgen.az to land on.
 */
export function mintPacsToken(opts: {
  sub: string;
  role: PacsRole;
  name?: string;
  study?: string;
  labels?: string[];
  dest?: string;
  ttlSec?: number;
}): string {
  if (!env.pacs.sharedSecret) throw new Error("PACS_SHARED_SECRET is not set");
  if (!opts.study && !opts.labels) throw new Error("mintPacsToken: study or labels required");
  const ttl = opts.ttlSec ?? 300;
  const payload = b64u(
    JSON.stringify({
      sub: opts.sub,
      role: opts.role,
      name: opts.name ?? "",
      study: opts.study,
      labels: opts.labels,
      dest: opts.dest,
      exp: Math.floor(Date.now() / 1000) + ttl,
    }),
  );
  const sig = b64u(createHmac("sha256", env.pacs.sharedSecret).update(payload).digest());
  return `${payload}.${sig}`;
}

export function pacsOpenUrl(opts: Parameters<typeof mintPacsToken>[0]): string {
  return `${env.pacs.url}/open?t=${mintPacsToken(opts)}`;
}

/** Raw Orthanc REST call (server-side, admin Basic auth). Path is relative to /orthanc/. */
export async function orthanc<T = unknown>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  if (!pacsOrthancConfigured()) throw new Error("PACS Orthanc credentials are not set");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 15000);
  try {
    const res = await fetch(`${env.pacs.url}/orthanc/${path.replace(/^\//, "")}`, {
      ...init,
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        authorization:
          "Basic " + Buffer.from(`${env.pacs.orthancUser}:${env.pacs.orthancPass}`).toString("base64"),
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`Orthanc ${res.status} ${path}`);
    const ct = res.headers.get("content-type") ?? "";
    return (ct.includes("json") ? await res.json() : await res.text()) as T;
  } finally {
    clearTimeout(t);
  }
}

export type PacsStudy = {
  id: string; // Orthanc ID
  studyUid: string;
  patientName: string;
  patientId: string;
  birthDate: string | null;
  studyDate: string | null; // YYYYMMDD
  description: string;
  modalities: string[];
  seriesCount: number;
  instancesCount: number;
  lastUpdate: Date | null;
  labels: string[];
  sizeMb: number | null;
};

type OrthancStudy = {
  ID: string;
  LastUpdate?: string;
  Labels?: string[];
  MainDicomTags?: Record<string, string>;
  PatientMainDicomTags?: Record<string, string>;
  Series?: string[];
  RequestedTags?: Record<string, string>;
};

function parseOrthancTime(s?: string): Date | null {
  // 20260819T192600
  if (!s || s.length < 15) return null;
  const d = new Date(
    Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(9, 11), +s.slice(11, 13), +s.slice(13, 15)),
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

/** All studies currently in the PACS cache/archive, newest first. */
export async function listPacsStudies(limit = 200): Promise<PacsStudy[]> {
  const rows = await orthanc<OrthancStudy[]>("tools/find", {
    method: "POST",
    body: JSON.stringify({
      Level: "Study",
      Query: {},
      Expand: true,
      Limit: limit,
      RequestedTags: ["ModalitiesInStudy", "NumberOfStudyRelatedInstances", "NumberOfStudyRelatedSeries"],
    }),
  });
  const out = rows.map((r) => {
    const m = r.MainDicomTags ?? {};
    const p = r.PatientMainDicomTags ?? {};
    const rq = r.RequestedTags ?? {};
    return {
      id: r.ID,
      studyUid: m.StudyInstanceUID ?? "",
      patientName: (p.PatientName ?? "").replace(/\^/g, " ").trim() || "—",
      patientId: p.PatientID ?? "",
      birthDate: p.PatientBirthDate || null,
      studyDate: m.StudyDate || null,
      description: m.StudyDescription ?? "",
      modalities: (rq.ModalitiesInStudy ?? "").split("\\").filter(Boolean),
      seriesCount: Number(rq.NumberOfStudyRelatedSeries ?? r.Series?.length ?? 0),
      instancesCount: Number(rq.NumberOfStudyRelatedInstances ?? 0),
      lastUpdate: parseOrthancTime(r.LastUpdate),
      labels: r.Labels ?? [],
      sizeMb: null,
    } satisfies PacsStudy;
  });
  out.sort((a, b) => (b.lastUpdate?.getTime() ?? 0) - (a.lastUpdate?.getTime() ?? 0));
  return out;
}

export async function pacsStats(): Promise<{ studies: number; instances: number; diskMb: number } | null> {
  try {
    const s = await orthanc<{ CountStudies: number; CountInstances: number; TotalDiskSizeMB: number }>("statistics");
    return { studies: s.CountStudies, instances: s.CountInstances, diskMb: s.TotalDiskSizeMB };
  } catch {
    return null;
  }
}
