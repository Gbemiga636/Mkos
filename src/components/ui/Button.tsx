"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/experience/ScrollReveal";
import { BrandText } from "@/components/ui/BrandText";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "bag" | "checkout";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Kept for call-site compatibility; cursor labels on buttons are disabled. */
  cursor?: "SHOP" | "VIEW" | "EXPLORE" | "ADD" | "";
  type?: "button" | "submit";
  disabled?: boolean;
};

function brandAwareChildren(children: React.ReactNode) {
  return typeof children === "string" && /\bmkos\b/i.test(children) ? (
    <BrandText>{children}</BrandText>
  ) : (
    children
  );
}

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
}: Props) {
  const label = brandAwareChildren(children);

  const classes = cn(
    "relative inline-flex items-center justify-center font-display tracking-[0.14em] uppercase",
    size === "sm" && "h-10 px-5 text-[10px]",
    size === "md" && "h-12 px-7 text-[11px]",
    size === "lg" && "h-14 px-9 text-xs",
    size === "xl" && "h-[4.25rem] px-10 text-[13px] tracking-[0.22em]",
    // !text-* so unlayered `a { color: inherit }` can't wash primary buttons out
    variant === "primary" && "bg-mkos-ink !text-white",
    variant === "secondary" && "bg-white !text-mkos-ink border border-mkos-border",
    variant === "ghost" && "bg-transparent !text-mkos-ink",
    variant === "outline" && "bg-transparent !text-white border border-white/30",
    variant === "bag" && "w-full bg-black !text-white border border-black",
    variant === "checkout" && "bg-mkos-accent !text-white",
    disabled && "pointer-events-none opacity-40",
    className
  );

  const inner = (
    <span className="relative z-10 flex items-center justify-center gap-3">{label}</span>
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {inner}
    </button>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  tone = "light",
  accentEyebrow = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** On dark backgrounds, small eyebrow labels use burnt orange instead of grey. */
  tone?: "light" | "dark";
  /** Force burnt orange eyebrow on light backgrounds (e.g. New Arrivals, Lookbook). */
  accentEyebrow?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <ScrollReveal
          y={16}
          className={cn(
            "mb-4 font-display text-[11px] tracking-[0.35em] uppercase",
            tone === "dark" || accentEyebrow ? "text-mkos-accent" : "text-mkos-muted"
          )}
        >
          <BrandText>{eyebrow}</BrandText>
        </ScrollReveal>
      )}
      <ScrollReveal y={32} delay={60}>
        <h2 className="font-display text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </ScrollReveal>
      {subtitle && (
        <ScrollReveal
          y={20}
          delay={120}
          className={cn(
            "mt-5 max-w-xl text-base leading-relaxed sm:text-lg",
            tone === "dark" ? "text-white/70" : "text-mkos-muted"
          )}
          style={align === "center" ? { marginInline: "auto" } : undefined}
        >
          {subtitle}
        </ScrollReveal>
      )}
    </div>
  );
}
