"use client";

import * as React from "react";
import { getAlertCountAction } from "@/app/actions/notifications";

/**
 * Browser desktop alerts for the doctor/center panels. While the panel is open
 * in a tab, this polls the combined unread count (new requests + new chat
 * messages) and, when it grows:
 *   1. plays a short "ding" (synthesized via Web Audio — no asset needed),
 *   2. shows a desktop Notification banner (if the user granted permission),
 *   3. updates the tab title to "(N) …".
 *
 * Autoplay/permission both need a user gesture, so the audio context is
 * unlocked and Notification permission is requested on the first click/keypress
 * — panel users always interact, so this is seamless. Renders nothing.
 */
const POLL_MS = 12_000;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function DashboardAlerts(): null {
  const lastCount = React.useRef<number | null>(null); // null = baseline not set yet
  const baseTitle = React.useRef<string>("");
  const audioCtx = React.useRef<AudioContext | null>(null);

  const ensureCtx = React.useCallback((): AudioContext | null => {
    try {
      const Ctx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtx.current) audioCtx.current = new Ctx();
      if (audioCtx.current.state === "suspended") void audioCtx.current.resume();
      return audioCtx.current;
    } catch {
      return null;
    }
  }, []);

  /** Two-tone chime (A5 → D6), soft attack/decay. */
  const ding = React.useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1174.7].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.16;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }, [ensureCtx]);

  const setTitleCount = React.useCallback((count: number) => {
    if (!baseTitle.current) return;
    document.title = count > 0 ? `(${count}) ${baseTitle.current}` : baseTitle.current;
  }, []);

  const banner = React.useCallback((count: number) => {
    try {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const n = new Notification("rentgen.az — yeni bildiriş", {
        body: count > 1 ? `${count} oxunmamış bildiriş / mesaj` : "Yeni mesaj və ya müraciət var",
        icon: "/mark-square.png",
        tag: "rentgen-alert",
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      /* ignore */
    }
  }, []);

  // Capture the base title; unlock audio + request Notification permission on
  // the first real user gesture (Safari requires a gesture for both).
  React.useEffect(() => {
    baseTitle.current = document.title.replace(/^\(\d+\)\s*/, "");
    const unlock = () => {
      ensureCtx();
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          void Notification.requestPermission();
        }
      } catch {
        /* ignore */
      }
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensureCtx]);

  // Poll the combined unread count; alert only on an increase.
  React.useEffect(() => {
    let stopped = false;
    const tick = async () => {
      let count: number;
      try {
        count = await getAlertCountAction();
      } catch {
        return;
      }
      if (stopped) return;
      if (lastCount.current !== null && count > lastCount.current) {
        ding();
        banner(count);
      }
      lastCount.current = count;
      setTitleCount(count);
    };
    const first = setTimeout(() => void tick(), 1200); // baseline shortly after load
    const timer = setInterval(() => void tick(), POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [ding, banner, setTitleCount]);

  return null;
}
