import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const has = get().ids.includes(id);
        set({
          ids: has ? get().ids.filter((x) => x !== id) : [...get().ids, id],
        });
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: "mkos-wishlist" }
  )
);
