import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/cms/types";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  /** Catalogue Naira amount (Paystack). */
  price: number;
  /** Explicit USD when set in admin. */
  priceUsd?: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  itemCount: () => number;
  subtotal: () => number;
};

function itemKey(item: { productId: string; color: string; size: string }) {
  return `${item.productId}-${item.color}-${item.size}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (item) => {
        const key = itemKey(item);
        const existing = get().items.find((i) => itemKey(i) === key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              itemKey(i) === key
                ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [...get().items, { ...item, quantity: item.quantity ?? 1 }],
            isOpen: true,
          });
        }
      },
      removeItem: (key) =>
        set({ items: get().items.filter((i) => itemKey(i) !== key) }),
      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set({
          items: get().items.map((i) =>
            itemKey(i) === key ? { ...i, quantity } : i
          ),
        });
      },
      clear: () => set({ items: [] }),
      itemCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    { name: "mkos-cart" }
  )
);

export function cartItemKey(item: { productId: string; color: string; size: string }) {
  return itemKey(item);
}

export function productToCartItem(
  product: Product,
  opts: { size: string; quantity?: number; color?: string }
): Omit<CartItem, "quantity"> & { quantity?: number } {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    priceUsd: product.priceUsd,
    image: product.images[0],
    color: opts.color ?? "",
    size: opts.size,
    quantity: opts.quantity,
  };
}
