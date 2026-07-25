"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const FLUSH_MS = 20_000;
const HEARTBEAT_MS = 60_000;
const MAX_EVENTS = 8;

function uid(key: string) {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `tmp-${Date.now()}`;
  }
}

function hasAnalyticsOptOut() {
  try {
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((c) => c.trim().startsWith("mkos_skip_analytics=1"));
  } catch {
    return false;
  }
}

function detect() {
  const ua = navigator.userAgent;
  const device = /Mobi|Android/i.test(ua) ? "mobile" : /Tablet|iPad/i.test(ua) ? "tablet" : "desktop";
  let browser = "other";
  if (ua.includes("Chrome")) browser = "chrome";
  else if (ua.includes("Safari")) browser = "safari";
  else if (ua.includes("Firefox")) browser = "firefox";
  else if (ua.includes("Edg")) browser = "edge";
  let os = "other";
  if (ua.includes("Windows")) os = "windows";
  else if (ua.includes("Mac")) os = "macos";
  else if (ua.includes("Android")) os = "android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "ios";
  return { device, browser, os };
}

/**
 * Lightweight storefront analytics — page views + explicit [data-track] only.
 * Batched every 20s; live heartbeat at most once per minute to protect Supabase free tier.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const started = useRef(Date.now());
  const queue = useRef<Record<string, unknown>[]>([]);
  const lastHeartbeat = useRef(0);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (hasAnalyticsOptOut()) return;

    const visitorId = uid("mkos_vid");
    const sessionId = uid("mkos_sid");
    const { device, browser, os } = detect();
    started.current = Date.now();

    const flush = async (events: Record<string, unknown>[], forceHeartbeat = false) => {
      if (hasAnalyticsOptOut()) return;
      if (!events.length && !forceHeartbeat) return;
      const now = Date.now();
      const heartbeat = forceHeartbeat || now - lastHeartbeat.current >= HEARTBEAT_MS;
      if (heartbeat) lastHeartbeat.current = now;

      try {
        await fetch("/api/analytics/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            visitorId,
            sessionId,
            path: pathname,
            referrer: document.referrer || null,
            device,
            browser,
            os,
            durationMs: now - started.current,
            heartbeat,
            events: events.slice(0, MAX_EVENTS),
          }),
          keepalive: true,
        });
      } catch {
        // silent — never block UX for analytics
      }
    };

    // One page_view per navigation (batched with first flush / heartbeat)
    queue.current.push({ type: "page_view", path: pathname });
    flush(queue.current.splice(0, MAX_EVENTS), true);

    const onClick = (e: MouseEvent) => {
      if (hasAnalyticsOptOut()) return;
      const t = e.target as HTMLElement | null;
      // Only explicit tracking attrs — not every link/button (huge write savings)
      const el = t?.closest("[data-track]") as HTMLElement | null;
      if (!el) return;
      queue.current.push({
        type: "click",
        path: pathname,
        label: (el.getAttribute("data-track") || "").trim().slice(0, 80),
      });
    };

    const interval = setInterval(() => {
      if (!queue.current.length) return;
      flush(queue.current.splice(0, MAX_EVENTS));
    }, FLUSH_MS);

    const onHide = () => {
      if (queue.current.length) flush(queue.current.splice(0), false);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    window.addEventListener("pagehide", onHide);

    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("pagehide", onHide);
      clearInterval(interval);
      if (queue.current.length) flush(queue.current.splice(0));
    };
  }, [pathname]);

  return null;
}
