"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrandText } from "@/components/ui/BrandText";

function ParticleField() {
  const dots = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        delay: (i % 10) * 0.35,
        size: 2 + (i % 3),
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-white/30"
          style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: 5 + (d.id % 5), repeat: Infinity, delay: d.delay }}
        />
      ))}
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("mkosfashionhouse@gmail.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          router.replace(d.mustSetPassword ? "/admin?setPassword=1" : "/admin");
        }
      })
      .catch(() => {});
  }, [router]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      // One white password modal lives in the dashboard (AdminShell)
      router.replace(data.mustSetPassword ? "/admin?setPassword=1" : "/admin");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070708] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,92,38,0.22),transparent_55%)]" />
      <ParticleField />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl sm:p-10"
        >
          <p className="font-display text-[11px] tracking-[0.35em] text-[#c45c26] uppercase">
            <BrandText>MKoS Control</BrandText>
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight">Sign in</h1>
          <p className="mt-3 text-sm text-white/55">
            Access the house dashboard — catalogue, orders, and experience.
          </p>

          <form onSubmit={onLogin} className="mt-8 space-y-5">
            <div>
              <label className="font-display text-[10px] tracking-[0.2em] text-white/45 uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 w-full border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-[#c45c26]/60"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="font-display text-[10px] tracking-[0.2em] text-white/45 uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-12 w-full border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-[#c45c26]/60"
                autoComplete="current-password"
                placeholder="Leave blank if not set yet"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-white/55">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-[#c45c26]"
              />
              Keep me signed in
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-[#c45c26] font-display text-[11px] tracking-[0.2em] text-white uppercase disabled:opacity-40"
            >
              {loading ? "Signing in…" : "Enter dashboard"}
            </button>
            <p className="text-center text-xs text-white/40">
              Forgot password? Contact the house to reset access.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
