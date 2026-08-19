/**
 * pacs.rentgen.az — auth gate (Caddy forward_auth backend + tiny SSO glue).
 *
 * Identity comes ONLY from rentgen.az (same phone numbers, same OTP login):
 *   1. Browser hits pacs.rentgen.az without a session → /gate answers 302 to
 *      https://rentgen.az/pacs/giris?next=<uri>  (rentgen.az logs the user in if
 *      needed, then mints an HMAC token describing WHO they are and WHAT they may see)
 *   2. → https://pacs.rentgen.az/open?t=<token> → we verify, set an HttpOnly session
 *      cookie, redirect to the requested page (OHIF).
 *   3. Every /orthanc/* request passes /verify: either the caller carries its own
 *      Basic auth (clinic gateways / admin tools → Orthanc validates it), or it has
 *      a valid session cookie whose SCOPE covers the requested study (→ we inject the
 *      Orthanc admin Basic header upstream).
 *   4. The OHIF study list (GET /dicom-web/studies) is served by /qido-studies so a
 *      scoped session only ever sees its own studies.
 *
 * Token / cookie payload (base64url JSON, HMAC-SHA256 with PACS_SHARED_SECRET):
 *   { sub, role, name, study?: "*" | StudyInstanceUID, labels?: string[], dest?, exp }
 *   - study "*"      → full access (admin)
 *   - study <uid>    → exactly one study (share link)
 *   - labels [...]   → every study carrying ANY of these Orthanc labels
 *                      (center-<id> | doctor-<id> | patient-<id>; Lua stamps
 *                      center-<id> from the gateway username gw-<id>)
 * Zero dependencies — Node ≥ 20.
 */
import http from "node:http";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const SECRET = process.env.PACS_SHARED_SECRET;
const ORTHANC_USER = process.env.ORTHANC_ADMIN_USER;
const ORTHANC_PASS = process.env.ORTHANC_ADMIN_PASS;
const ORTHANC = process.env.ORTHANC_INTERNAL_URL || "http://orthanc:8042";
const LOGIN_PAGE = readFileSync(new URL("./login.html", import.meta.url));
const SESSION_TTL = Number(process.env.PACS_SESSION_TTL_SEC || 12 * 3600);
const COOKIE = "pacs_s";
if (!SECRET || !ORTHANC_USER || !ORTHANC_PASS) {
  console.error("missing PACS_SHARED_SECRET / ORTHANC_ADMIN_USER / ORTHANC_ADMIN_PASS");
  process.exit(1);
}
const ADMIN_BASIC = "Basic " + Buffer.from(`${ORTHANC_USER}:${ORTHANC_PASS}`).toString("base64");

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const sign = (payloadB64) => b64u(crypto.createHmac("sha256", SECRET).update(payloadB64).digest());

function mint(payload, ttlSec) {
  const p = b64u(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec }));
  return `${p}.${sign(p)}`;
}

function verifyToken(tok) {
  if (!tok || typeof tok !== "string") return null;
  const i = tok.lastIndexOf(".");
  if (i < 1) return null;
  const p = tok.slice(0, i), s = tok.slice(i + 1);
  const expect = sign(p);
  if (s.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expect))) return null;
  try {
    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now() / 1000) return null;
    if (payload.study !== "*" && !(typeof payload.study === "string" && payload.study) && !Array.isArray(payload.labels)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(h) {
  const out = {};
  (h || "").split(";").forEach((kv) => {
    const i = kv.indexOf("=");
    if (i > 0) out[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  });
  return out;
}

const safeDest = (d) => (typeof d === "string" && d.startsWith("/") && !d.startsWith("//") ? d : "/");

// ---------- Orthanc helpers (server-side, admin creds) ----------
async function orthanc(path, init = {}) {
  const res = await fetch(ORTHANC + path, {
    ...init,
    headers: { authorization: ADMIN_BASIC, "content-type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`orthanc ${res.status} ${path}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : res.text();
}

/** StudyInstanceUID → { id, labels } (cached 60 s; null if unknown). */
const studyCache = new Map();
async function studyByUid(uid) {
  const hit = studyCache.get(uid);
  if (hit && hit.ts > Date.now() - 60_000) return hit.v;
  let v = null;
  try {
    const found = await orthanc("/tools/lookup", { method: "POST", body: uid });
    const st = Array.isArray(found) ? found.find((x) => x.Type === "Study") : null;
    if (st) {
      const j = await orthanc(`/studies/${st.ID}`);
      v = { id: st.ID, labels: j.Labels || [] };
    }
  } catch {
    v = null;
  }
  studyCache.set(uid, { ts: Date.now(), v });
  return v;
}

/** All StudyInstanceUIDs a label-scoped session may see (cached 20 s per label set). */
const listCache = new Map();
async function uidsForLabels(labels) {
  const key = [...labels].sort().join("|");
  const hit = listCache.get(key);
  if (hit && hit.ts > Date.now() - 20_000) return hit.v;
  let v = [];
  if (labels.length) {
    try {
      const rows = await orthanc("/tools/find", {
        method: "POST",
        body: JSON.stringify({ Level: "Study", Query: {}, Labels: labels, LabelsConstraint: "Any", Expand: true, Limit: 500 }),
      });
      v = rows.map((r) => r.MainDicomTags?.StudyInstanceUID).filter(Boolean);
      for (const r of rows) {
        const uid = r.MainDicomTags?.StudyInstanceUID;
        if (uid) studyCache.set(uid, { ts: Date.now(), v: { id: r.ID, labels: r.Labels || [] } });
      }
    } catch {
      v = [];
    }
  }
  listCache.set(key, { ts: Date.now(), v });
  return v;
}

/** Which StudyInstanceUIDs does this Orthanc/DICOMweb request touch? (null = not study-scoped) */
function requestedStudies(uri) {
  const u = new URL(uri, "http://x");
  const path = u.pathname.replace(/^\/orthanc/, "");
  const uids = new Set();
  const m = path.match(/\/dicom-web\/studies\/([0-9.]+)/);
  if (m) uids.add(m[1]);
  for (const k of ["StudyInstanceUID", "0020000D"]) {
    const v = u.searchParams.get(k);
    if (v) v.split(/[,\\]/).forEach((x) => x && uids.add(x));
  }
  return uids.size ? [...uids] : null;
}

async function sessionAllowsStudy(session, uid) {
  if (session.study === "*") return true;
  if (typeof session.study === "string") return session.study === uid;
  if (Array.isArray(session.labels)) {
    const st = await studyByUid(uid);
    return Boolean(st && st.labels.some((l) => session.labels.includes(l)));
  }
  return false;
}

async function allowed(session, uri) {
  if (session.study === "*") return true;
  const want = requestedStudies(uri);
  if (!want) return false; // scoped session, non-study request (system, list, …) → deny
  for (const u of want) if (!(await sessionAllowsStudy(session, u))) return false;
  return true;
}

const ROLE_LABEL = { admin: "Admin", doctor: "Həkim", center: "Mərkəz", patient: "Pasiyent" };

// ---------- HTTP ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, body = "", headers = {}) => {
    res.writeHead(code, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...headers });
    res.end(body);
  };
  const json = (code, obj) => send(code, JSON.stringify(obj), { "content-type": "application/json; charset=utf-8" });
  const session = () => verifyToken(parseCookies(req.headers["cookie"])[COOKIE]);

  try {
    if (url.pathname === "/healthz") return send(200, "ok");

    // PACS-ın öz giriş səhifəsi (yalnız həkim/mərkəz; API rentgen.az-dadır)
    if (url.pathname === "/login") {
      return send(200, LOGIN_PAGE, { "content-type": "text/html; charset=utf-8" });
    }

    // rentgen.az → signed token → session cookie → OHIF
    if (url.pathname === "/open") {
      const payload = verifyToken(url.searchParams.get("t"));
      if (!payload) return send(401, "Link etibarsızdır və ya vaxtı bitib. rentgen.az-dan yenidən açın.");
      const ttl = SESSION_TTL;
      const cookieVal = mint(
        { sub: payload.sub, role: payload.role, name: payload.name || "", study: payload.study, labels: payload.labels },
        ttl,
      );
      const dest = payload.dest
        ? safeDest(payload.dest)
        : typeof payload.study === "string" && payload.study !== "*"
          ? `/viewer?StudyInstanceUIDs=${encodeURIComponent(payload.study)}`
          : "/";
      return send(302, "", {
        "set-cookie": `${COOKIE}=${cookieVal}; Path=/; Max-Age=${ttl}; HttpOnly; Secure; SameSite=Lax`,
        location: dest,
      });
    }

    if (url.pathname === "/logout") {
      return send(302, "", {
        "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
        location: "https://rentgen.az/",
      });
    }

    // forward_auth for the OHIF app: no session → bounce to rentgen.az SSO
    if (url.pathname === "/gate") {
      if (session()) return send(200);
      const wantsHtml = (req.headers["accept"] || "").includes("text/html");
      if (!wantsHtml) return send(401, "unauthorized");
      return send(302, "", { location: "/login" });
    }

    // who is logged in (for the OHIF header bar)
    if (url.pathname === "/whoami") {
      const s = session();
      if (!s) return json(401, { ok: false });
      return json(200, {
        ok: true,
        name: s.name || "",
        role: s.role,
        roleLabel: ROLE_LABEL[s.role] || s.role,
        scope: s.study === "*" ? "all" : typeof s.study === "string" ? "study" : "labels",
      });
    }

    // forward_auth for /orthanc/*
    if (url.pathname === "/verify") {
      // Caller brings its own credentials (gateway peers, admin curl) → let Orthanc decide.
      // Echo the header back: Caddy's copy_headers overwrites upstream Authorization with
      // whatever we return — returning nothing would strip the client's credentials.
      if (req.headers["authorization"]) return send(200, "", { authorization: req.headers["authorization"] });
      const s = session();
      if (!s) return send(401, "unauthorized");
      const fwdUri = req.headers["x-forwarded-uri"] || "/";
      if (!(await allowed(s, fwdUri))) return send(403, "forbidden");
      return send(200, "", { authorization: ADMIN_BASIC });
    }

    // Scoped study list for OHIF (Caddy rewrites GET /orthanc/dicom-web/studies here)
    if (url.pathname === "/qido-studies") {
      const basic = req.headers["authorization"];
      const s = basic ? null : session();
      if (!basic && !s) return send(401, "unauthorized");
      const qs = url.searchParams;
      const upstream = async (params, auth) => {
        const r = await fetch(`${ORTHANC}/dicom-web/studies?${params.toString()}`, {
          headers: { authorization: auth, accept: req.headers["accept"] || "application/dicom+json" },
        });
        if (r.status === 204) return [];
        if (!r.ok) throw new Error(`orthanc ${r.status}`);
        return r.json();
      };
      // Full access (own Basic creds, or admin session) → pass-through
      if (basic || s.study === "*") {
        const rows = await upstream(qs, basic || ADMIN_BASIC);
        return rows.length ? json(200, rows) : send(204);
      }
      // Scoped → intersect with what the session may see
      let allowedUids = typeof s.study === "string" ? [s.study] : await uidsForLabels(s.labels || []);
      const asked = requestedStudies(url.pathname + url.search);
      if (asked) allowedUids = allowedUids.filter((u) => asked.includes(u));
      if (!allowedUids.length) return send(204);
      qs.delete("StudyInstanceUID");
      qs.delete("0020000D");
      const chunks = await Promise.all(
        allowedUids.slice(0, 200).map((u) => {
          const p = new URLSearchParams(qs);
          p.set("StudyInstanceUID", u);
          return upstream(p, ADMIN_BASIC).catch(() => []);
        }),
      );
      const rows = chunks.flat();
      return rows.length ? json(200, rows) : send(204);
    }

    return send(404, "not found");
  } catch (e) {
    console.error("[pacs-auth]", url.pathname, e?.message || e);
    return send(502, "pacs auth error");
  }
});

server.listen(9000, () => console.log("pacs-auth listening :9000"));
