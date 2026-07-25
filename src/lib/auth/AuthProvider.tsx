"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useCartStore, type CartItem } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUIStore } from "@/store/ui";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  reward_points: number;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "full_name" | "phone">>) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function cartKey(item: CartItem) {
  return `${item.productId}-${item.color}-${item.size}`;
}

async function pullUserData(userId: string) {
  const sb = getBrowserSupabase();
  const [{ data: cart }, { data: wish }, { data: recent }] = await Promise.all([
    sb.from("user_cart_items").select("*").eq("user_id", userId),
    sb.from("user_wishlist").select("product_id").eq("user_id", userId),
    sb
      .from("user_recently_viewed")
      .select("product_id")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(8),
  ]);

  const remoteCart: CartItem[] = (cart ?? []).map((row) => ({
    productId: row.product_id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    image: row.image,
    color: row.color,
    size: row.size,
    quantity: row.quantity,
  }));

  const localItems = useCartStore.getState().items;
  const merged = new Map<string, CartItem>();
  for (const item of remoteCart) merged.set(cartKey(item), item);
  for (const item of localItems) {
    const key = cartKey(item);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        quantity: Math.max(existing.quantity, item.quantity),
      });
    } else {
      merged.set(key, item);
    }
  }
  useCartStore.setState({ items: Array.from(merged.values()) });

  if (wish) {
    useWishlistStore.setState({ ids: wish.map((w) => w.product_id) });
  }
  if (recent?.length) {
    useUIStore.getState().setRecentlyViewed(recent.map((r) => r.product_id));
  }
}

async function pushCart(userId: string, items: CartItem[]) {
  const sb = getBrowserSupabase();
  await sb.from("user_cart_items").delete().eq("user_id", userId);
  if (!items.length) return;
  await sb.from("user_cart_items").insert(
    items.map((i) => ({
      user_id: userId,
      product_id: i.productId,
      slug: i.slug,
      name: i.name,
      price: i.price,
      image: i.image,
      color: i.color,
      size: i.size,
      quantity: i.quantity,
    }))
  );
}

async function pushWishlist(userId: string, ids: string[]) {
  const sb = getBrowserSupabase();
  await sb.from("user_wishlist").delete().eq("user_id", userId);
  if (!ids.length) return;
  await sb.from("user_wishlist").insert(
    ids.map((product_id) => ({ user_id: userId, product_id }))
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const sb = getBrowserSupabase();
    const {
      data: { user: u },
    } = await sb.auth.getUser();
    if (!u) {
      setProfile(null);
      return;
    }
    const { data } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        reward_points: data.reward_points ?? 0,
      });
    } else {
      // Ensure profile row exists
      await sb.from("profiles").upsert({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name ?? u.email?.split("@")[0],
      });
      const { data: again } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle();
      if (again) {
        setProfile({
          id: again.id,
          email: again.email,
          full_name: again.full_name,
          phone: again.phone,
          reward_points: again.reward_points ?? 0,
        });
      }
    }
  }, []);

  useEffect(() => {
    const sb = getBrowserSupabase();
    let mounted = true;

    sb.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await pullUserData(data.session.user.id);
        await refreshProfile();
      }
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange(async (event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      // Skip TOKEN_REFRESHED — it was re-pulling/pushing full cart on every refresh (DB burn)
      if (next?.user && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        await pullUserData(next.user.id);
        await refreshProfile();
        await pushCart(next.user.id, useCartStore.getState().items);
        await pushWishlist(next.user.id, useWishlistStore.getState().ids);
      }
      if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  // Persist cart to Supabase when logged in
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useCartStore.subscribe((state) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushCart(user.id, state.items).catch(console.error);
      }, 2000);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [user]);

  // Persist wishlist
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useWishlistStore.subscribe((state) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushWishlist(user.id, state.ids).catch(console.error);
      }, 2000);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [user]);

  // Persist recently viewed
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useUIStore.subscribe((state, prev) => {
      if (state.recentlyViewed === prev.recentlyViewed) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const sb = getBrowserSupabase();
        const ids = state.recentlyViewed.slice(0, 8);
        if (!ids.length) return;
        await Promise.all(
          ids.map((product_id) =>
            sb.from("user_recently_viewed").upsert({
              user_id: user.id,
              product_id,
              viewed_at: new Date().toISOString(),
            })
          )
        );
      }, 2500);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getBrowserSupabase();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const sb = getBrowserSupabase();
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const sb = getBrowserSupabase();
    await sb.auth.signOut();
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<Profile, "full_name" | "phone">>) => {
      if (!user) return { error: "Not signed in" };
      const sb = getBrowserSupabase();
      const { error } = await sb
        .from("profiles")
        .update(patch)
        .eq("id", user.id);
      if (error) return { error: error.message };
      await refreshProfile();
      return {};
    },
    [user, refreshProfile]
  );

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [user, session, profile, loading, signIn, signUp, signOut, refreshProfile, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
