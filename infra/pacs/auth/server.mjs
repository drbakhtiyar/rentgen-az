/**
 * pacs.rentgen.az — auth gate (Caddy forward_auth backend).
 *
 * Flow:
 *   rentgen.az signs a short-lived token (HMAC-SHA256, PACS_SHARED_SECRET)
 *   → browser opens https://pacs.rentgen.az/open?t=<token>
 *   → we verify, set an HttpOnly session cookie, redirect to OHIF
 *   → every /orthanc/* request is checked here (/verify): either the caller
 *     carries its own Basic auth (gateways / admin tools → Orthanc validates it),
 *     or it has a valid session cookie scoped to the requested StudyInstanceUID
 *     (→ we inject the Orthanc admin Basic header upstream).
 *
 * Token payload (base64url JSON): { sub, role, study, exp }
 *   study: StudyInstanceUID or "*" (admin / full access)
 *   role:  "admin" | "doctor" | "center" | "patient"
 * Zero dependencies — Node ≥ 20.
 */
import http from "node:http";
import crypto from "node:crypto";

const SECRET = process.env.PACS_SHARED_SECRET;
const ORTHANC_USER = process.env.ORTHANC_ADMIN_USER;
const ORTHANC_PASS = process.env.ORTHANC_ADMIN_PASS;
const SESSION_TTL = Number(process.env.PACS_SESSION_TTL_SEC || 12 * 3600);
const COOKIE = "pacs_s";
if (!SECRET || !ORTHANC_USER || !ORTHANC_PASS) {
  console.error("missing PACS_SHARED_SECRET / ORTHANC_ADMIN_USER / ORTHANC_ADMIN_PASS");
  process.exit(1);
}
const ADMIN_BASIC = "Basic " + Buffer.from(`${ORTHANC_USER}:${ORTHANC_PASS}`).toString("base64");

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const sign = (payloadB64) => b64u(crypto.createHmac("sha256", SECRET).update(payloadB64).digest());

export function mint(payload, ttlSec) {
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
    if (!payload.study) return null;
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

/** Which StudyInstanceUIDs does this Orthanc/DICOMweb request touch? (null = not study-scoped) */
function requestedStudies(uri) {
  const u = new URL(uri, "http://x");
  const path = u.pathname.replace(/^\/orthanc/, "");
  const uids = new Set();
  const m = path.match(/\/dicom-web\/studies\/([0-9.]+)/);
  if (m) uids.add(m[1]);
  for (const k of ["StudyInstanceUID", "0020000D"]) {
    const v = u.searchParams.get(k);
    if (v) v.split(",").forEach((x) => x && uids.add(x));
  }
  if (uids.size) return [...uids];
  // QIDO root listing (/dicom-web/studies without filter) or anything else → needs full access
  return null;
}

function allowed(session, uri) {
  if (session.study === "*") return true;
  const want = requestedStudies(uri);
  if (!want) return false; // session is study-scoped but request is not → deny
  return want.every((u) => u === session.study);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, body = "", headers = {}) => {
    res.writeHead(code, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...headers });
    res.end(body);
  };

  if (url.pathname === "/healthz") return send(200, "ok");

  if (url.pathname === "/open") {
    const payload = verifyToken(url.searchParams.get("t"));
    if (!payload) return send(401, "Link etibarsızdır və ya vaxtı bitib. rentgen.az-dan yenidən açın.");
    const ttl = Math.min(SESSION_TTL, Math.max(60, payload.exp - Math.floor(Date.now() / 1000) + SESSION_TTL));
    const cookieVal = mint({ sub: payload.sub, role: payload.role, study: payload.study }, ttl);
    const dest = payload.study === "*" ? "/" : `/viewer?StudyInstanceUIDs=${encodeURIComponent(payload.study)}`;
    return send(302, "", {
      "set-cookie": `${COOKIE}=${cookieVal}; Path=/; Max-Age=${ttl}; HttpOnly; Secure; SameSite=Lax`,
      location: dest,
    });
  }

  if (url.pathname === "/logout") {
    return send(302, "", { "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, location: "https://rentgen.az/" });
  }

  if (url.pathname === "/verify") {
    // Caller brings its own credentials (gateway peers, admin curl) → let Orthanc decide.
    // (Echo the header back: Caddy's copy_headers overwrites upstream Authorization with
    // whatever we return — returning nothing would strip the client's credentials.)
    if (req.headers["authorization"]) return send(200, "", { authorization: req.headers["authorization"] });
    const session = verifyToken(parseCookies(req.headers["cookie"])[COOKIE]);
    if (!session) return send(401, "unauthorized");
    const fwdUri = req.headers["x-forwarded-uri"] || "/";
    if (!allowed(session, fwdUri)) return send(403, "forbidden");
    return send(200, "", { authorization: ADMIN_BASIC });
  }

  return send(404, "not found");
});

server.listen(9000, () => console.log("pacs-auth listening :9000"));
