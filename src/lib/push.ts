import "server-only";
import { prisma } from "./db";

/**
 * Expo push notifications for the mobile app.
 *
 * The server only forwards messages to Expo's push service — Expo delivers to
 * APNs (iOS) / FCM (Android) using the credentials configured in the Expo/EAS
 * build, so NO Apple/Google keys live here. That means this works end-to-end
 * as soon as the app has a real push build; nothing else on the site changes.
 *
 * Delivery is best-effort: every function swallows its own errors so a push
 * failure can never break the request that triggered it (in-app notifications
 * remain the source of truth).
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_RE = /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/;

/** A token string is a plausible Expo push token. */
export function isExpoPushToken(token: string): boolean {
  return EXPO_TOKEN_RE.test((token ?? "").trim());
}

interface ExpoMessage {
  to: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  sound: "default";
  priority: "high";
  channelId: "default";
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send a push to every device registered for `userId`. No-op when the user has
 * no tokens (the common case for web-only users), so it is cheap to call from
 * the shared notify path. Prunes tokens Expo reports as unregistered.
 */
export async function sendPushToUser(
  userId: string | null | undefined,
  title: string,
  body?: string | null,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!userId) return;
  try {
    const rows = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (rows.length === 0) return;
    const tokens = rows.map((r) => r.token).filter(isExpoPushToken);
    if (tokens.length === 0) return;

    const messages: ExpoMessage[] = tokens.map((to) => ({
      to,
      title,
      body: body ?? undefined,
      data: data ?? {},
      sound: "default",
      priority: "high",
      channelId: "default",
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    let res: Response;
    try {
      res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Optional: set EXPO_ACCESS_TOKEN to require an authorized sender.
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(messages),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return;

    // Prune tokens Expo says are no longer valid (app deleted / reinstalled).
    const payload = (await res.json()) as { data?: ExpoTicket[] } | null;
    const tickets = payload?.data ?? [];
    const dead: string[] = [];
    tickets.forEach((t, i) => {
      if (t.status === "error" && t.details?.error === "DeviceNotRegistered") {
        const tok = tokens[i];
        if (tok) dead.push(tok);
      }
    });
    if (dead.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: dead } } }).catch(() => {});
    }
  } catch {
    /* best-effort — never throw */
  }
}
