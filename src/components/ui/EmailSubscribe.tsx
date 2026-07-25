"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type EmailSubscribeProps = {
  variant?: "light" | "dark" | "ink";
  buttonLabel?: string;
  successLabel?: string;
  placeholder?: string;
  className?: string;
};

export function EmailSubscribe({
  variant = "light",
  buttonLabel = "Subscribe",
  successLabel = "You're on the list",
  placeholder = "you@email.com",
  className,
}: EmailSubscribeProps) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [focused, setFocused] = useState(false);

  const isDark = variant === "dark" || variant === "ink";

  return (
    <form
      className={cn("w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (email) setDone(true);
      }}
    >
      <label
        className={cn(
          "font-display text-[10px] tracking-[0.28em] uppercase",
          isDark ? "text-white/55" : "text-mkos-muted"
        )}
      >
        Email address
      </label>
      <div
        className={cn(
          "mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch",
          "transition-shadow duration-300"
        )}
      >
        <div
          className={cn(
            "relative flex-1 overflow-hidden border transition-colors duration-300",
            variant === "light" &&
              (focused
                ? "border-mkos-accent bg-white shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
                : "border-mkos-border bg-white"),
            variant === "dark" &&
              (focused
                ? "border-white/70 bg-white/15"
                : "border-white/25 bg-white/10"),
            variant === "ink" &&
              (focused
                ? "border-mkos-accent bg-white"
                : "border-white/15 bg-white")
          )}
        >
          <input
            type="email"
            required
            value={email}
            disabled={done}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className={cn(
              "h-14 w-full bg-transparent px-5 font-body text-sm outline-none",
              variant === "dark"
                ? "text-white placeholder:text-white/45"
                : "text-mkos-ink placeholder:text-mkos-muted/60",
              done && "opacity-60"
            )}
          />
          <span
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 h-[2px] origin-left transition-transform duration-500",
              variant === "dark" ? "bg-white" : "bg-mkos-accent",
              focused || email ? "scale-x-100" : "scale-x-0"
            )}
            style={{ width: "100%" }}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={done}
          variant={variant === "dark" ? "secondary" : "primary"}
          className={cn(
            variant === "dark" && "bg-white text-mkos-ink hover:bg-white/90",
            variant === "ink" && "shrink-0",
            "sm:min-w-[9.5rem]"
          )}
          cursor=""
        >
          {done ? successLabel : buttonLabel}
        </Button>
      </div>
      {done && (
        <p
          className={cn(
            "mt-3 text-sm",
            isDark && variant !== "ink" ? "text-white/70" : "text-mkos-muted"
          )}
        >
          Thank you — we’ll keep you close to the next drop.
        </p>
      )}
    </form>
  );
}

type ContactBoxProps = {
  label: string;
  value: string;
  href: string;
  hint?: string;
};

export function ContactBox({ label, value, href, hint }: ContactBoxProps) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="group block border border-mkos-border bg-white p-6 transition-colors duration-300 hover:border-mkos-accent/50 hover:bg-mkos-warm/60 sm:p-7"
    >
      <p className="font-display text-[10px] tracking-[0.28em] text-mkos-muted uppercase">
        {label}
      </p>
      <p className="mt-3 font-display text-lg tracking-tight text-mkos-ink transition-colors group-hover:text-mkos-accent sm:text-xl">
        {value}
      </p>
      {hint && <p className="mt-2 text-sm text-mkos-muted">{hint}</p>}
      <p className="mt-5 font-display text-[10px] tracking-[0.2em] text-mkos-accent uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        Open →
      </p>
    </a>
  );
}
