"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlobalSpinner } from "@/components/experience/GlobalSpinner";
import { useBusyStore } from "@/store/busy";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/live", label: "Live" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/content", label: "Website" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/notifications", label: "Alerts" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/settings", label: "Settings" },
];

type Props = {
  children: React.ReactNode;
  admin: { email: string; full_name: string | null; mustSetPassword: boolean };
};

export function AdminShell({ children, admin }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const withBusy = useBusyStore((s) => s.withBusy);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pwOpen, setPwOpen] = useState(admin.mustSetPassword || params.get("setPassword") === "1");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Don't count admin browsing in storefront analytics
  useEffect(() => {
    try {
      document.cookie = "mkos_skip_analytics=1; path=/; max-age=1209600; SameSite=Lax";
      const visitorId = localStorage.getItem("mkos_vid");
      const sessionId = localStorage.getItem("mkos_sid");
      if (visitorId) {
        fetch("/api/analytics/collect", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ visitorId, sessionId }),
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return NAV.filter((n) => n.label.toLowerCase().includes(q));
  }, [query]);

  async function logout() {
    await withBusy(async () => {
      await fetch("/api/admin/auth/session", { method: "POST" });
      router.replace("/admin/login");
    }, "Signing out…");
  }

  async function savePassword() {
    setPwMsg("");
    await withBusy(async () => {
      const res = await fetch("/api/admin/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, confirm: pw2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg(data.error || "Failed");
        return;
      }
      setPwOpen(false);
      router.replace("/admin");
    }, "Saving password…");
  }

  return (
    <div className="min-h-screen bg-mkos-warm text-mkos-ink font-body">
      <GlobalSpinner />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,92,38,0.06),transparent_50%)]" />

      <div className="relative flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-mkos-border bg-white transition-transform lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-20 items-center gap-3 border-b border-mkos-border px-5">
            <Image
              src="/logo/mkos-logo.png"
              alt="MKOS"
              width={88}
              height={36}
              className="h-8 w-auto brightness-0"
            />
            <div>
              <p className="font-display text-[10px] tracking-[0.28em] text-mkos-muted uppercase">
                Admin
              </p>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "block rounded-none px-3 py-2.5 font-display text-[11px] tracking-[0.18em] uppercase transition-colors",
                    active
                      ? "bg-mkos-ink text-white"
                      : "text-mkos-muted hover:bg-mkos-warm hover:text-mkos-ink"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-mkos-border p-4">
            <Link
              href="/"
              target="_blank"
              className="font-display text-[10px] tracking-[0.2em] text-mkos-accent uppercase"
            >
              View storefront →
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-mkos-border bg-white/90 px-4 backdrop-blur-md sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center border border-mkos-border lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                ☰
              </button>
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="hidden h-10 min-w-[240px] items-center justify-between border border-mkos-border bg-mkos-warm/50 px-4 font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase sm:flex"
              >
                <span>Search</span>
                <kbd className="border border-mkos-border px-1.5 py-0.5 text-[9px]">⌘K</kbd>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="font-display text-sm tracking-tight">{admin.full_name || "Admin"}</p>
                <p className="text-xs text-mkos-muted">{admin.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="h-10 bg-mkos-ink px-4 font-display text-[10px] tracking-[0.18em] text-white uppercase"
              >
                Log out
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
        </div>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-mkos-ink/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <AnimatePresence>
        {cmdOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-mkos-ink/40 px-4 pt-[18vh] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCmdOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xl border border-mkos-border bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to products, orders, settings…"
                className="h-14 w-full border-b border-mkos-border bg-transparent px-5 text-sm outline-none"
              />
              <div className="max-h-72 overflow-y-auto p-2">
                {filtered.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    className="flex w-full px-3 py-2.5 text-left font-display text-[11px] tracking-[0.16em] text-mkos-muted uppercase hover:bg-mkos-warm hover:text-mkos-ink"
                    onClick={() => {
                      setCmdOpen(false);
                      router.push(item.href);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pwOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-mkos-ink/50 px-5 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-md border border-mkos-border bg-white p-8 shadow-2xl">
              <p className="font-display text-[10px] tracking-[0.28em] text-mkos-accent uppercase">
                Security
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Create your administrator password
              </h2>
              <p className="mt-2 text-sm text-mkos-muted">
                This reminder appears until you set a password. After that, email-only login is
                disabled.
              </p>
              <div className="mt-6 space-y-3">
                <input
                  type="password"
                  placeholder="New password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="h-12 w-full border border-mkos-border bg-mkos-warm/40 px-4 text-sm outline-none focus:border-mkos-accent"
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="h-12 w-full border border-mkos-border bg-mkos-warm/40 px-4 text-sm outline-none focus:border-mkos-accent"
                />
                {pwMsg && <p className="text-sm text-red-600">{pwMsg}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={savePassword}
                    className="h-12 flex-1 bg-mkos-ink font-display text-[10px] tracking-[0.18em] text-white uppercase"
                  >
                    Save password
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwOpen(false)}
                    className="h-12 flex-1 border border-mkos-border font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
