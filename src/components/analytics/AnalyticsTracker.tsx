"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const FLUSH_MS = 20_000;
const HEARTBEAT_MS = 60_000;
const MAX_EVENTS = 8;
const SESSION_TTL_MS = 30 * 60 * 1000;

function visitorId() {
  try {
    const existing = localStorage.getItem("mkos_vid");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("mkos_vid", id);
    return id;
  } catch {
    return "";
  }
}

/** Sliding 30-minute session — avoids one forever-session and tmp-ids on every load */
function sessionId() {
  try {
    const now = Date.now();
    const exp = Number(localStorage.getItem("mkos_sid_exp") || 0);
    let id = localStorage.getItem("mkos_sid");
    if (!id || now > exp) {
      id = crypto.randomUUID();
      localStorage.setItem("mkos_sid", id);
    }
    localStorage.setItem("mkos_sid_exp", String(now + SESSION_TTL_MS));
    return id;
  } catch {
    return "";
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

function isLocalDevHost() {
  try {
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h.endsWith(".local");
  } catch {
    return false;
  }
}

function detect() {
  const ua = navigator.userAgent;
  const device = /Mobi|Android/i.test(ua) ? "mobile" : /Tablet|iPad/i.test(ua) ? "tablet" : "desktop";
  let browser = "other";
  if (ua.includes("Edg")) browser = "edge";
  else if (ua.includes("Chrome")) browser = "chrome";
  else if (ua.includes("Safari")) browser = "safari";
  else if (ua.includes("Firefox")) browser = "firefox";
  let os = "other";
  if (ua.includes("Windows")) os = "windows";
  else if (ua.includes("Mac")) os = "macos";
  else if (ua.includes("Android")) os = "android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "ios";
  return { device, browser, os };
}

/**
 * Lightweight storefront analytics — unique visitors + page views.
 * Skips admin cookie, localhost, and missing storage ids.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const started = useRef(Date.now());
  const queue = useRef<Record<string, unknown>[]>([]);
  const lastHeartbeat = useRef(0);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (hasAnalyticsOptOut()) return;
    if (isLocalDevHost()) return;

    const vid = visitorId();
    const sid = sessionId();
    if (!vid || !sid) return;

    const { device, browser, os } = detect();
    started.current = Date.now();

    const flush = async (events: Record<string, unknown>[], forceHeartbeat = false) => {
      if (hasAnalyticsOptOut() || isLocalDevHost()) return;
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
            visitorId: vid,
            sessionId: sid,
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
        /* silent */
      }
    };

    // One page_view per distinct path change (not every React remount)
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      queue.current.push({ type: "page_view", path: pathname });
      flush(queue.current.splice(0, MAX_EVENTS), true);
    } else {
      flush([], true);
    }

    const onClick = (e: MouseEvent) => {
      if (hasAnalyticsOptOut()) return;
      const t = e.target as HTMLElement | null;
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
    };
  }, [pathname]);

  return null;
}
