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
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
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
    "group relative inline-flex items-center justify-center overflow-hidden font-display tracking-[0.12em] uppercase transition-all duration-500 ease-out will-change-transform",
    size === "sm" && "h-10 px-5 text-[10px]",
    size === "md" && "h-12 px-7 text-[11px]",
    size === "lg" && "h-14 px-9 text-xs",
    variant === "primary" &&
      "bg-mkos-ink text-white hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_0_40px_rgba(91,33,182,0.35)]",
    variant === "secondary" && "bg-white text-mkos-ink border border-mkos-border hover:border-mkos-ink/30",
    variant === "ghost" && "bg-transparent text-mkos-ink hover:bg-mkos-warm",
    variant === "outline" &&
      "bg-transparent text-white border border-white/30 hover:border-white hover:bg-white/10",
    disabled && "pointer-events-none opacity-40",
    className
  );

  const inner = (
    <>
      <span className="relative z-10 transition-transform duration-500 group-hover:-translate-y-[120%] group-active:scale-95">
        {children}
      </span>
      <span className="absolute inset-0 z-10 flex translate-y-[120%] items-center justify-center transition-transform duration-500 group-hover:translate-y-0">
        {children}
      </span>
      {variant === "primary" && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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
