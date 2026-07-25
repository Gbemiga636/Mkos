"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { products, formatPrice } from "@/data/products";
import { useWishlistStore } from "@/store/wishlist";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";

const tabs = ["Overview", "Orders", "Wishlist", "Addresses", "Settings", "Rewards"] as const;

export default function AccountPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const wishIds = useWishlistStore((s) => s.ids);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const recentlyViewed = useUIStore((s) => s.recentlyViewed);
  const wished = products.filter((p) => wishIds.includes(p.id));
  const recent = recentlyViewed
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
          Account
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Welcome back
        </h1>

        <div className="mt-10 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 border px-4 py-2 font-display text-[10px] tracking-[0.18em] uppercase transition-colors",
                tab === t ? "border-mkos-ink bg-mkos-ink text-white" : "border-mkos-border"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          {tab === "Overview" && (
            <div className="grid gap-8 lg:grid-cols-3">
              <Stat label="Orders" value="2" />
              <Stat label="Wishlist" value={String(wishIds.length)} />
              <Stat label="Reward points" value="1,240" />
              <div className="lg:col-span-3">
                <h2 className="font-display text-2xl">Recently viewed</h2>
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {(recent.length ? recent : products.slice(0, 4)).map((p) => (
                    <Link key={p!.id} href={`/product/${p!.slug}`} className="group">
                      <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm">
                        <Image
                          src={p!.images[0]}
                          alt={p!.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="25vw"
                        />
                      </div>
                      <p className="mt-3 font-display">{p!.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Orders" && (
            <div className="space-y-4">
              {[
                { id: "MK-20491", date: "Jul 12, 2026", status: "Delivered", total: 890000 },
                { id: "MK-20311", date: "Jun 28, 2026", status: "In transit", total: 420000 },
              ].map((o) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-4 border border-mkos-border p-5"
                >
                  <div>
                    <p className="font-display text-lg">{o.id}</p>
                    <p className="mt-1 text-sm text-mkos-muted">{o.date}</p>
                  </div>
                  <p className="text-sm">{o.status}</p>
                  <p className="font-display tabular-nums">{formatPrice(o.total)}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "Wishlist" && (
            <div>
              {wished.length === 0 ? (
                <p className="text-mkos-muted">Your wishlist is waiting for its first piece.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {wished.map((p) => (
                    <div key={p.id}>
                      <Link href={`/product/${p.slug}`}>
                        <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm">
                          <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="25vw" />
                        </div>
                        <p className="mt-3 font-display">{p.name}</p>
                        <p className="text-sm text-mkos-muted">{formatPrice(p.price)}</p>
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleWish(p.id)}
                        className="mt-2 text-xs text-mkos-muted underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "Addresses" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-mkos-border p-6">
                <p className="font-display text-[11px] tracking-[0.22em] text-mkos-muted uppercase">
                  Primary
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  18 Mercer Street
                  <br />
                  New York, NY 10013
                  <br />
                  United States
                </p>
              </div>
              <button
                type="button"
                className="border border-dashed border-mkos-border p-6 text-left font-display text-sm tracking-[0.15em] uppercase transition-colors hover:border-mkos-ink"
              >
                + Add address
              </button>
            </div>
          )}

          {tab === "Settings" && (
            <form className="max-w-lg space-y-4" onSubmit={(e) => e.preventDefault()}>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-mkos-muted">
                  Name
                </span>
                <input
                  defaultValue="Alex Morgan"
                  className="mt-2 h-12 w-full border border-mkos-border px-4 outline-none focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
                />
              </label>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-mkos-muted">
                  Email
                </span>
                <input
                  defaultValue="alex@studio.com"
                  className="mt-2 h-12 w-full border border-mkos-border px-4 outline-none focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
                />
              </label>
              <label className="flex items-center gap-3 pt-2 text-sm">
                <input type="checkbox" defaultChecked className="accent-violet-700" />
                Email me about private drops
              </label>
              <button
                type="submit"
                className="mt-4 h-12 bg-mkos-ink px-8 font-display text-[11px] tracking-[0.22em] text-white uppercase"
              >
                Save changes
              </button>
            </form>
          )}

          {tab === "Rewards" && (
            <div className="max-w-xl">
              <p className="font-display text-6xl font-medium tracking-tight">1,240</p>
              <p className="mt-2 text-mkos-muted">points · Atelier Member</p>
              <div className="mt-8 h-2 overflow-hidden bg-mkos-warm">
                <motion.div
                  className="h-full gradient-purple"
                  initial={{ width: 0 }}
                  animate={{ width: "62%" }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="mt-3 text-sm text-mkos-muted">760 points to Private Client status</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-mkos-border p-6">
      <p className="font-display text-[11px] tracking-[0.28em] text-mkos-muted uppercase">{label}</p>
      <p className="mt-3 font-display text-4xl font-medium">{value}</p>
    </div>
  );
}
