import "server-only";
import http2 from "node:http2";
import { importPKCS8, SignJWT } from "jose";
import { prisma } from "./db";

/**
 * Push notifications for the mobile app — delivered straight to Apple APNs.
 *
 * The iOS app is a NATIVE build (not Expo): it registers with APNs and stores
 * the raw hex device token. So the server talks to APNs directly over HTTP/2
 * with a JWT (ES256) signed by the APNs Auth Key (.p8). No third-party push
 * service, no Apple keys in the app bundle.
 *
 * It stays inert until the APNs env vars are set (like the Google rating key),
 * so nothing breaks before the Apple Developer account is ready:
 *   APNS_KEY_P8    — the .p8 auth key contents (-----BEGIN PRIVATE KEY----- …)
 *   APNS_KEY_ID    — the key's 10-char Key ID
 *   APNS_TEAM_ID   — the Apple Developer Team ID
 *   APNS_BUNDLE_ID — the app bundle id (= apns-topic), e.g. app.rork.xxxx
 *   APNS_ENV       — "production" (default) | "sandbox"
 *
 * Delivery is best-effort: every function swallows its own errors so a push
 * failure can never break the request that triggered it (in-app notifications
 * remain the source of truth). Tokens APNs rejects as invalid are pruned.
 */

const JWT_REUSE_SEC = 3000; // reuse the APNs JWT < 50 min (Apple rejects > 1 h)

/** A token the app may register: a native APNs hex token, or an Expo token. */
export function isValidPushToken(token: string): boolean {
  const t = (token ?? "").trim();
  if (/^[0-9a-fA-F]{60,200}$/.test(t)) return true; // native APNs device token
  if (/^Expo(nent)?PushToken\[.+\]$/.test(t)) return true; // legacy / compatibility
  return false;
}

interface ApnsConfig {
  keyP8: string;
  keyId: string;
  teamId: string;
  topic: string;
  host: string;
}

function apnsConfig(): ApnsConfig | null {
  const keyP8 = process.env.APNS_KEY_P8;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const topic = process.env.APNS_BUNDLE_ID;
  if (!keyP8 || !keyId || !teamId || !topic) return null;
  const sandbox = (process.env.APNS_ENV ?? "production").toLowerCase() === "sandbox";
  return {
    keyP8: keyP8.replace(/\\n/g, "\n"), // env stores newlines as \n
    keyId,
    teamId,
    topic,
    host: sandbox ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com",
  };
}

let jwtCache: { token: string; at: number } | null = null;

async function apnsAuthToken(cfg: ApnsConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (jwtCache && now - jwtCache.at < JWT_REUSE_SEC) return jwtCache.token;
  const key = await importPKCS8(cfg.keyP8, "ES256");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: cfg.keyId })
    .setIssuer(cfg.teamId)
    .setIssuedAt(now)
    .sign(key);
  jwtCache = { token, at: now };
  return token;
}

type SendResult = { status: number; reason?: string };

/** POST one alert to APNs on an existing HTTP/2 session; resolves best-effort. */
function sendOne(
  session: http2.ClientHttp2Session,
  cfg: ApnsConfig,
  jwt: string,
  token: string,
  payload: string,
): Promise<SendResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r: SendResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    try {
      const req = session.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        authorization: `bearer ${jwt}`,
        "apns-topic": cfg.topic,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      });
      let status = 0;
      let data = "";
      req.on("response", (h) => {
        status = Number(h[":status"]) || 0;
      });
      req.setEncoding("utf8");
      req.on("data", (c) => {
        data += c;
      });
      req.on("end", () => {
        let reason: string | undefined;
        try {
          reason = data ? (JSON.parse(data).reason as string) : undefined;
        } catch {
          /* no body */
        }
        finish({ status, reason });
      });
      req.on("error", () => finish({ status: 0 }));
      req.setTimeout(6000, () => {
        try {
          req.close();
        } catch {
          /* noop */
        }
        finish({ status: 0 });
      });
      req.end(payload);
    } catch {
      finish({ status: 0 });
    }
  });
}

/** A token APNs says is permanently invalid → prune it. */
function isDeadToken(r: SendResult): boolean {
  if (r.status === 410) return true; // Unregistered
  if (r.status === 400) {
    return r.reason === "BadDeviceToken" || r.reason === "DeviceTokenNotForTopic" || r.reason === "Unregistered";
  }
  return false;
}

/**
 * Send a push to every device registered for `userId`. No-op when the user has
 * no tokens (the common case for web-only users) or when APNs isn't configured
 * yet, so it is cheap to call from the shared notify path. `data` becomes the
 * top-level custom keys (e.g. `link`, `type`) the app reads on tap.
 */
export async function sendPushToUser(
  userId: string | null | undefined,
  title: string,
  body?: string | null,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!userId) return;
  try {
    const cfg = apnsConfig();
    const rows = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true, platform: true },
    });
    if (rows.length === 0) return;
    // iOS/APNs tokens only for now (Android/FCM would be a separate transport).
    const tokens = rows
      .filter((r) => r.platform !== "android" && isValidPushToken(r.token))
      .map((r) => r.token);
    if (tokens.length === 0 || !cfg) return; // inert until APNs env is set

    const jwt = await apnsAuthToken(cfg);
    const payload = JSON.stringify({
      aps: { alert: { title, body: body ?? undefined }, sound: "default" },
      ...(data ?? {}),
    });

    const session = http2.connect(cfg.host);
    session.on("error", () => {});
    const results = await Promise.all(tokens.map((t) => sendOne(session, cfg, jwt, t, payload)));
    try {
      session.close();
    } catch {
      /* noop */
    }

    const dead = tokens.filter((_, i) => isDeadToken(results[i]));
    if (dead.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: dead } } }).catch(() => {});
    }
  } catch {
    /* best-effort — never throw */
  }
}
