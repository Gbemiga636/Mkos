"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/shop", label: "All Products" },
      { href: "/shop?collection=noir-edit", label: "Noir Edit" },
      { href: "/shop?collection=white-space", label: "White Space" },
      { href: "/shop?filter=new", label: "New Arrivals" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/#faq", label: "FAQ" },
      { href: "/account", label: "Orders" },
      { href: "/account", label: "Shipping" },
      { href: "/account", label: "Returns" },
    ],
  },
  {
    title: "House",
    links: [
      { href: "/#story", label: "Our Story" },
      { href: "/#campaign", label: "Campaign" },
      { href: "/account", label: "Atelier Care" },
      { href: "/account", label: "Sustainability" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-mkos-border bg-mkos-warm">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(91,33,182,0.08),transparent_70%)]" />

      <div className="mx-auto max-w-[1600px] px-5 pt-24 pb-10 sm:px-8 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase"
            >
              Private list
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="mt-4 max-w-xl font-display text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl lg:text-6xl"
            >
              Enter the next chapter before it opens.
            </motion.h2>
            <form
              className="mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setJoined(true);
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="h-14 flex-1 border border-mkos-border bg-white px-5 font-body text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(91,33,182,0.15)]"
              />
              <Button type="submit" size="lg">
                {joined ? "Joined" : "Join"}
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">
                  {col.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-mkos-ink/80 transition-colors hover:text-mkos-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 flex flex-col gap-8 border-t border-mkos-border pt-10 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-display text-6xl font-medium tracking-tighter sm:text-8xl lg:text-[9rem] leading-none">
            MKOS
          </p>
          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex gap-5 text-sm text-mkos-muted">
              <a href="#" className="hover:text-mkos-ink">
                Instagram
              </a>
              <a href="#" className="hover:text-mkos-ink">
                Pinterest
              </a>
              <a href="#" className="hover:text-mkos-ink">
                X
              </a>
            </div>
            <p className="text-xs text-mkos-muted">
              © {new Date().getFullYear()} MKOS. All rights reserved.
            </p>
            <div className="flex gap-3 text-[10px] tracking-wider text-mkos-silver uppercase">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>Amex</span>
              <span>Apple Pay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
