"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const open = useUIStore((s) => s.authOpen);
  const mode = useUIStore((s) => s.authMode);
  const closeAuth = useUIStore((s) => s.closeAuth);
  const openAuth = useUIStore((s) => s.openAuth);
  const { signIn, signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const reset = () => {
    setError("");
    setMessage("");
    setBusy(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    if (mode === "signin") {
      const res = await signIn(email, password);
      setBusy(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      closeAuth();
      return;
    }
    if (password.length < 6) {
      setBusy(false);
      setError("Password must be at least 6 characters.");
      return;
    }
    const res = await signUp(email, password, fullName.trim() || email.split("@")[0]);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setMessage("Account created. You are signed in — welcome to MKoS.");
    setTimeout(() => closeAuth(), 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[85] bg-mkos-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuth}
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-1/2 left-1/2 z-[86] w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 bg-white p-7 shadow-lift sm:p-9"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
                {mode === "signin" ? "Sign in" : "Create account"}
              </p>
              <button
                type="button"
                onClick={closeAuth}
                className="font-display text-[11px] tracking-[0.18em] uppercase"
              >
                Close
              </button>
            </div>

            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">
              {mode === "signin" ? "Welcome back." : "Join the house."}
            </h2>
            <p className="mt-2 text-sm text-mkos-muted">
              Your bag, addresses, and orders stay with you across devices.
            </p>

            <div className="mt-6 flex border border-mkos-border">
              <button
                type="button"
                onClick={() => {
                  openAuth("signin");
                  reset();
                }}
                className={cn(
                  "flex-1 py-3 font-display text-[10px] tracking-[0.2em] uppercase",
                  mode === "signin" ? "bg-mkos-ink text-white" : "bg-white"
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  openAuth("signup");
                  reset();
                }}
                className={cn(
                  "flex-1 py-3 font-display text-[10px] tracking-[0.2em] uppercase",
                  mode === "signup" ? "bg-mkos-ink text-white" : "bg-white"
                )}
              >
                Sign up
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {mode === "signup" && (
                <label className="block">
                  <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
                    Full name
                  </span>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 h-12 w-full border border-mkos-border px-4 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
                  />
                </label>
              )}
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full border border-mkos-border px-4 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
                />
              </label>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
                  Password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 h-12 w-full border border-mkos-border px-4 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
                />
              </label>

              {error && <p className="text-sm text-red-700">{error}</p>}
              {message && <p className="text-sm text-orange-800">{message}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
