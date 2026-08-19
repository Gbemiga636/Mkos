"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWishlistStore } from "@/store/wishlist";
import { useUIStore } from "@/store/ui";
import { useCartStore } from "@/store/cart";
import { useCms, useFormatPrice } from "@/lib/cms/CmsProvider";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/cms/types";
import { PhoneField } from "@/components/checkout/CountryFields";
import {
  DEFAULT_COUNTRY,
  formatInternationalPhone,
  parseInternationalPhone,
} from "@/lib/checkout/countries";

const tabs = ["Overview", "Orders", "Wishlist", "Addresses", "Settings", "For you"] as const;

type Address = {
  id: string;
  label: string;
  full_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
};

type OrderRow = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items?: { name: string; quantity: number; image: string | null }[];
};

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  const { products } = useCms();
  const formatPrice = useFormatPrice();
  const wishIds = useWishlistStore((s) => s.ids);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const recentlyViewed = useUIStore((s) => s.recentlyViewed);
  const cartItems = useCartStore((s) => s.items);

  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phoneDial, setPhoneDial] = useState(DEFAULT_COUNTRY.dial);
  const [phoneNational, setPhoneNational] = useState("");
  const [addrPhoneDial, setAddrPhoneDial] = useState(DEFAULT_COUNTRY.dial);
  const [addrPhoneNational, setAddrPhoneNational] = useState("");
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Nigeria",
  });

  const loadAccount = useCallback(async () => {
    if (!user) return;
    const sb = getBrowserSupabase();
    const [{ data: addrs }, { data: ords }] = await Promise.all([
      sb.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      sb
        .from("orders")
        .select("id,status,total,created_at,order_items(name,quantity,image)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setAddresses((addrs as Address[]) ?? []);
    setOrders((ords as OrderRow[]) ?? []);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openAuth("signin");
      router.replace("/");
      return;
    }
    setName(profile?.full_name ?? "");
    const parsed = parseInternationalPhone(profile?.phone ?? "");
    setPhoneDial(parsed.dial);
    setPhoneNational(parsed.national);
    loadAccount();
  }, [user, loading, profile, openAuth, router, loadAccount]);

  const wished = products.filter((p) => wishIds.includes(p.id));
  const recent = recentlyViewed
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const suggestions = useMemo(() => {
    const seedIds = new Set<string>([
      ...cartItems.map((i) => i.productId),
      ...wishIds,
      ...recentlyViewed,
    ]);
    const seedProducts = products.filter((p) => seedIds.has(p.id));
    const collections = new Set(seedProducts.map((p) => p.collection));
    const categories = new Set(seedProducts.map((p) => p.category));

    let pool = products.filter(
      (p) =>
        !seedIds.has(p.id) &&
        (collections.has(p.collection) || categories.has(p.category) || p.trending || p.bestSeller)
    );
    if (pool.length < 4) {
      pool = products.filter((p) => !seedIds.has(p.id));
    }
    return pool.slice(0, 4);
  }, [products, cartItems, wishIds, recentlyViewed]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="h-9 w-9 animate-spin rounded-full border border-mkos-ink/15 border-t-mkos-ink" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-white pt-28 pb-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-[11px] tracking-[0.35em] text-mkos-muted uppercase">
              Account
            </p>
            <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-sm text-mkos-muted">{user.email}</p>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            Sign out
          </Button>
        </div>

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
              <Stat label="Orders" value={String(orders.length)} />
              <Stat label="Wishlist" value={String(wishIds.length)} />
              <Stat
                label="Reward points"
                value={(profile?.reward_points ?? 0).toLocaleString("en-NG")}
              />
              <div className="lg:col-span-3">
                <h2 className="font-display text-2xl">Picked for you</h2>
                <p className="mt-1 text-sm text-mkos-muted">
                  Based on your bag, wishlist, and browsing.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {suggestions.map((p) => (
                    <Link key={p.id} href={`/product/${p.slug}`} className="group">
                      <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm">
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="25vw"
                        />
                      </div>
                      <p className="mt-3 font-display">{p.name}</p>
                      <p className="text-sm text-mkos-muted">{formatPrice(p.price)}</p>
                    </Link>
                  ))}
                </div>
              </div>
              {recent.length > 0 && (
                <div className="lg:col-span-3">
                  <h2 className="font-display text-2xl">Recently viewed</h2>
                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {recent.slice(0, 4).map((p) => (
                      <Link key={p.id} href={`/product/${p.slug}`} className="group">
                        <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm">
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="25vw"
                          />
                        </div>
                        <p className="mt-3 font-display">{p.name}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "Orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-mkos-muted">No orders yet. Your first piece is waiting.</p>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-4 border border-mkos-border p-5"
                  >
                    <div>
                      <p className="font-display text-lg">
                        {o.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-sm text-mkos-muted">
                        {new Date(o.created_at).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {o.order_items?.[0] ? ` · ${o.order_items[0].name}` : ""}
                      </p>
                    </div>
                    <p className="text-sm capitalize">{o.status}</p>
                    <p className="font-display tabular-nums">{formatPrice(Number(o.total))}</p>
                  </div>
                ))
              )}
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
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                {addresses.length === 0 && (
                  <p className="text-mkos-muted">No saved addresses yet.</p>
                )}
                {addresses.map((a) => (
                  <div key={a.id} className="border border-mkos-border p-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-[11px] tracking-[0.22em] text-mkos-muted uppercase">
                        {a.label}
                        {a.is_default ? " · Default" : ""}
                      </p>
                      <button
                        type="button"
                        className="text-xs text-mkos-muted underline"
                        onClick={async () => {
                          const sb = getBrowserSupabase();
                          await sb.from("addresses").delete().eq("id", a.id);
                          loadAccount();
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">
                      {a.full_name}
                      <br />
                      {a.line1}
                      {a.line2 ? (
                        <>
                          <br />
                          {a.line2}
                        </>
                      ) : null}
                      <br />
                      {a.city}
                      {a.state ? `, ${a.state}` : ""} {a.postal_code}
                      <br />
                      {a.country}
                    </p>
                  </div>
                ))}
              </div>

              <form
                className="space-y-3 border border-mkos-border p-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user) return;
                  setSaving(true);
                  const sb = getBrowserSupabase();
                  if (addresses.length === 0) {
                    // first address becomes default
                  }
                  await sb.from("addresses").insert({
                    user_id: user.id,
                    ...addrForm,
                    phone: formatInternationalPhone(addrPhoneDial, addrPhoneNational) || null,
                    is_default: addresses.length === 0,
                  });
                  setSaving(false);
                  setAddrForm({
                    label: "Home",
                    full_name: profile?.full_name ?? "",
                    phone: "",
                    line1: "",
                    line2: "",
                    city: "",
                    state: "",
                    postal_code: "",
                    country: "Nigeria",
                  });
                  setAddrPhoneDial(DEFAULT_COUNTRY.dial);
                  setAddrPhoneNational("");
                  loadAccount();
                }}
              >
                <p className="font-display text-lg">Add address</p>
                {(
                  [
                    ["label", "Label"],
                    ["full_name", "Full name"],
                    ["line1", "Address line 1"],
                    ["line2", "Address line 2"],
                    ["city", "City"],
                    ["state", "State"],
                    ["postal_code", "Postal code"],
                    ["country", "Country"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="font-display text-[10px] tracking-[0.2em] uppercase text-mkos-muted">
                      {label}
                    </span>
                    <input
                      required={key !== "line2" && key !== "state"}
                      value={addrForm[key]}
                      onChange={(e) => setAddrForm({ ...addrForm, [key]: e.target.value })}
                      className="mt-2 h-11 w-full border border-mkos-border px-3 text-sm outline-none focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
                    />
                  </label>
                ))}
                <PhoneField
                  label="Phone"
                  dial={addrPhoneDial}
                  national={addrPhoneNational}
                  onDialChange={(dial) => setAddrPhoneDial(dial)}
                  onNationalChange={setAddrPhoneNational}
                />
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save address"}
                </Button>
              </form>
            </div>
          )}

          {tab === "Settings" && (
            <form
              className="max-w-lg space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                await updateProfile({
                  full_name: name,
                  phone: formatInternationalPhone(phoneDial, phoneNational) || null,
                });
                setSaving(false);
              }}
            >
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-mkos-muted">
                  Name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 h-12 w-full border border-mkos-border px-4 outline-none focus:shadow-[0_0_0_3px_rgba(91,33,182,0.12)]"
                />
              </label>
              <label className="block">
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-mkos-muted">
                  Email
                </span>
                <input
                  value={user.email ?? ""}
                  disabled
                  className="mt-2 h-12 w-full border border-mkos-border bg-mkos-warm px-4 text-mkos-muted outline-none"
                />
              </label>
              <PhoneField
                label="Phone"
                dial={phoneDial}
                national={phoneNational}
                onDialChange={(dial) => setPhoneDial(dial)}
                onNationalChange={setPhoneNational}
              />
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          )}

          {tab === "For you" && (
            <div>
              <h2 className="font-display text-2xl">Suggested for you</h2>
              <p className="mt-2 max-w-xl text-sm text-mkos-muted">
                Quiet recommendations drawn from what you browse, save, and carry in your bag.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {suggestions.map((p) => (
                  <Link key={p.id} href={`/product/${p.slug}`} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden bg-mkos-warm">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="25vw"
                      />
                    </div>
                    <p className="mt-3 font-display">{p.name}</p>
                    <p className="text-sm text-mkos-muted">{formatPrice(p.price)}</p>
                  </Link>
                ))}
              </div>
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
