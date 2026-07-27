"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

type Strength = {
  checks: { length: boolean; upper: boolean; lower: boolean; number: boolean; special: boolean };
  score: number;
  ok: boolean;
  label: string;
};

function localStrength(password: string): Strength {
  const checks = {
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    score,
    ok: Object.values(checks).every(Boolean),
    label: score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Strong" : "Excellent",
  };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("mkosfashionhouse@gmail.com");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const strength = localStrength(pw);

  useEffect(() => {
    fetch("/api/admin/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          if (d.mustSetPassword) setNeedsPassword(true);
          else router.replace("/admin");
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
      if (data.mustSetPassword) {
        setNeedsPassword(true);
      } else {
        router.replace("/admin");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, confirm: pw2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save password");
        return;
      }
      setNeedsPassword(false);
      router.replace("/admin");
    } catch {
      setError("Could not save password.");
    } finally {
      setSavingPw(false);
    }
  }

  async function skipForNow() {
    // Allowed: enter dashboard but modal returns on next login until password is set
    router.replace("/admin?setPassword=1");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(196,92,38,0.35),transparent_45%),radial-gradient(ellipse_at_80%_0%,rgba(255,255,255,0.08),transparent_40%),linear-gradient(160deg,#0a0a0b,#141416_50%,#1a1210)]" />
      <ParticleField />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center">
            <p className="font-[family-name:var(--font-space-grotesk)] text-[11px] tracking-[0.4em] text-white/50 uppercase">
              MKoS Control
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-4xl font-medium tracking-tight">
              Admin
            </h1>
            <p className="mt-2 text-sm text-white/55">For Those Who Understand STYLE.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-7 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <form onSubmit={onLogin} className="space-y-5">
              <div>
                <label className="text-[10px] tracking-[0.22em] text-white/45 uppercase">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full border border-white/10 bg-black/30 px-4 text-sm outline-none transition focus:border-[#c45c26]/60 focus:shadow-[0_0_0_3px_rgba(196,92,38,0.2)]"
                  autoComplete="username"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] tracking-[0.22em] text-white/45 uppercase">
                    Password
                  </label>
                  <span className="text-[10px] text-white/35">First visit? Leave blank</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 h-12 w-full border border-white/10 bg-black/30 px-4 text-sm outline-none transition focus:border-[#c45c26]/60 focus:shadow-[0_0_0_3px_rgba(196,92,38,0.2)]"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-white/60">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-[#c45c26]"
                  />
                  Remember me
                </label>
                <button type="button" className="text-white/45 hover:text-white/80">
                  Forgot password
                </button>
              </div>
              {error && !needsPassword && (
                <p className="text-sm text-red-300">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="relative h-12 w-full overflow-hidden bg-white font-[family-name:var(--font-space-grotesk)] text-[11px] tracking-[0.22em] text-black uppercase transition hover:bg-[#f5f5f5] disabled:opacity-50"
              >
                {loading ? (
                  <motion.span
                    className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  "Enter dashboard"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {needsPassword && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121214] p-8 shadow-2xl"
            >
              <p className="text-[10px] tracking-[0.28em] text-[#c45c26] uppercase">Welcome</p>
              <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl tracking-tight">
                Please create your administrator password.
              </h2>
              <p className="mt-3 text-sm text-white/55">
                You can set it later, but we’ll remind you every login until it’s secured.
              </p>
              <form onSubmit={onSetPassword} className="mt-8 space-y-4">
                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase">
                    New password
                  </label>
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="mt-2 h-12 w-full border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-[#c45c26]/60"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] text-white/45 uppercase">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    className="mt-2 h-12 w-full border border-white/10 bg-black/40 px-4 text-sm outline-none focus:border-[#c45c26]/60"
                    required
                  />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-white/50">Strength</span>
                    <span className="text-[#c45c26]">{strength.label}</span>
                  </div>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[#c45c26] transition-all"
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <ul className="grid grid-cols-2 gap-2 text-[11px] text-white/55">
                    {(
                      [
                        ["length", "10+ characters"],
                        ["upper", "Uppercase"],
                        ["lower", "Lowercase"],
                        ["number", "Number"],
                        ["special", "Special character"],
                      ] as const
                    ).map(([k, label]) => (
                      <li key={k} className={strength.checks[k] ? "text-emerald-300" : ""}>
                        {strength.checks[k] ? "✓" : "○"} {label}
                      </li>
                    ))}
                  </ul>
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={savingPw || !strength.ok}
                    className="h-12 flex-1 bg-[#c45c26] text-[11px] tracking-[0.2em] text-white uppercase disabled:opacity-40"
                  >
                    {savingPw ? "Saving…" : "Save password"}
                  </button>
                  <button
                    type="button"
                    onClick={skipForNow}
                    className="h-12 flex-1 border border-white/15 text-[11px] tracking-[0.2em] text-white/70 uppercase hover:text-white"
                  >
                    Set later
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
