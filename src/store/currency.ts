"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_DISPLAY_CURRENCY,
  isKnownCurrency,
} from "@/lib/currency/currencies";

type CurrencyState = {
  currency: string;
  setCurrency: (code: string) => void;
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: DEFAULT_DISPLAY_CURRENCY,
      setCurrency: (code) => {
        const next = String(code || DEFAULT_DISPLAY_CURRENCY).toUpperCase();
        if (!isKnownCurrency(next)) return;
        set({ currency: next });
      },
    }),
    { name: "mkos-currency-v1" }
  )
);
