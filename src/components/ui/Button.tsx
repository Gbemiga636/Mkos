"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useCursorLabel } from "@/hooks/useCursorLabel";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "bag" | "checkout";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  cursor?: "SHOP" | "VIEW" | "EXPLORE" | "ADD" | "";
  type?: "button" | "submit";
  disabled?: boolean;
};

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  cursor = "SHOP",
  type = "button",
  disabled,
}: Props) {
  const ref = useMagnetic<HTMLElement>(0.28);
  const cursorProps = useCursorLabel(cursor || "");

  const classes = cn(
    "group relative inline-flex items-center justify-center overflow-hidden font-display tracking-[0.14em] uppercase transition-all duration-500 ease-out will-change-transform",
    size === "sm" && "h-10 px-5 text-[10px]",
    size === "md" && "h-12 px-7 text-[11px]",
    size === "lg" && "h-14 px-9 text-xs",
    size === "xl" && "h-[4.25rem] px-10 text-[13px] tracking-[0.22em]",
    variant === "primary" &&
      "bg-mkos-ink text-white hover:shadow-[0_0_0_1px_rgba(196,92,38,0.35),0_0_40px_rgba(196,92,38,0.28)]",
    variant === "secondary" &&
      "bg-white text-mkos-ink border border-mkos-border hover:border-mkos-ink/30",
    variant === "ghost" && "bg-transparent text-mkos-ink hover:bg-mkos-warm",
    variant === "outline" &&
      "bg-transparent text-white border border-white/30 hover:border-white hover:bg-white/10",
    variant === "bag" &&
      "w-full bg-black text-white border border-black hover:bg-[#0a0a0a] hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] active:scale-[0.985]",
    variant === "checkout" &&
      "bg-mkos-accent text-white shadow-[0_10px_30px_-12px_rgba(196,92,38,0.65)] hover:bg-mkos-accent-deep hover:shadow-[0_14px_36px_-10px_rgba(196,92,38,0.75)]",
    disabled && "pointer-events-none opacity-40",
    className
  );

  const inner = (
    <>
      <span className="relative z-10 flex items-center justify-center gap-3 transition-transform duration-500 group-hover:-translate-y-[120%] group-active:scale-95">
        {children}
      </span>
      <span className="absolute inset-0 z-10 flex translate-y-[120%] items-center justify-center gap-3 transition-transform duration-500 group-hover:translate-y-0">
        {children}
      </span>
      {variant === "primary" && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-orange-500/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}
      {variant === "bag" && (
        <>
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,transparent_40%)]" />
          <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[#c45c26] transition-transform duration-500 group-hover:scale-x-100" />
        </>
      )}
      {variant === "checkout" && (
        <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-white/70 transition-transform duration-500 group-hover:scale-x-100" />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        onClick={onClick}
        {...cursorProps}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      ref={ref as React.RefObject<HTMLButtonElement>}
      {...cursorProps}
    >
      {inner}
    </button>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="mb-4 font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.7, delay: 0.05 }}
        className="font-display text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mt-5 max-w-xl text-base leading-relaxed text-mkos-muted sm:text-lg"
          style={align === "center" ? { marginInline: "auto" } : undefined}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
