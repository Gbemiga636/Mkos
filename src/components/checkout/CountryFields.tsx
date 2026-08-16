"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { COUNTRIES, type CountryOption } from "@/lib/checkout/countries";

const fieldShell =
  "mt-2 h-12 w-full border border-mkos-border bg-mkos-warm/50 px-4 text-sm outline-none transition-shadow focus:border-mkos-accent focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]";

export function CountrySelect({
  label = "Country",
  value,
  onChange,
  className,
  placeholder = "Search country…",
}: {
  label?: string;
  value: string; // country name
  onChange: (country: CountryOption) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.code.toLowerCase().includes(needle) ||
        c.dial.includes(needle.replace(/^\+/, ""))
    );
  }, [q]);

  return (
    <div ref={rootRef} className={cn("relative block", className)}>
      <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
        {label}
      </span>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQ("");
        }}
        className={cn(fieldShell, "flex items-center justify-between text-left")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn(!value && "text-mkos-muted")}>{value || placeholder}</span>
        <span className="text-mkos-muted" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full border border-mkos-border bg-white shadow-soft">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full border-b border-mkos-border px-4 text-sm outline-none"
          />
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-mkos-muted">No matches</li>
            ) : (
              filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.name === value}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-mkos-warm/60",
                      c.name === value && "bg-mkos-warm/40"
                    )}
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    <span>{c.name}</span>
                    <span className="font-mono text-xs text-mkos-muted">+{c.dial}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function PhoneField({
  dial,
  national,
  onDialChange,
  onNationalChange,
  className,
}: {
  dial: string;
  national: string;
  onDialChange: (dial: string, country?: CountryOption) => void;
  onNationalChange: (national: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.code.toLowerCase().includes(needle) ||
        c.dial.includes(needle.replace(/^\+/, ""))
    );
  }, [q]);

  const selected = COUNTRIES.find((c) => c.dial === dial) || COUNTRIES[0]!;

  return (
    <label className={cn("block", className)}>
      <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
        WhatsApp / phone
      </span>
      <div ref={rootRef} className="relative mt-2 flex">
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setQ("");
          }}
          className="flex h-12 shrink-0 items-center gap-1 border border-r-0 border-mkos-border bg-mkos-warm/50 px-3 text-sm outline-none transition-shadow focus:border-mkos-accent focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Country dial code"
        >
          <span className="font-mono">+{selected.dial}</span>
          <span className="text-mkos-muted" aria-hidden>
            ▾
          </span>
        </button>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          onChange={(e) => onNationalChange(e.target.value.replace(/[^\d\s()-]/g, ""))}
          placeholder="Phone number"
          className="h-12 w-full border border-mkos-border bg-mkos-warm/50 px-4 text-sm outline-none transition-shadow focus:border-mkos-accent focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
        />

        {open ? (
          <div className="absolute left-0 top-full z-30 mt-1 w-[min(100%,20rem)] border border-mkos-border bg-white shadow-soft">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search country or code…"
              className="h-11 w-full border-b border-mkos-border px-4 text-sm outline-none"
            />
            <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
              {filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.dial === dial}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-mkos-warm/60",
                      c.dial === dial && "bg-mkos-warm/40"
                    )}
                    onClick={() => {
                      onDialChange(c.dial, c);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    <span>{c.name}</span>
                    <span className="font-mono text-xs text-mkos-muted">+{c.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </label>
  );
}
