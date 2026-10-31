"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_DISPLAY_CURRENCY,
  fractionDigitsFor,
  localeForCurrency,
} from "@/lib/currency/currencies";
import { convertFromNgn } from "@/lib/currency/rates";
import { useCurrencyStore } from "@/store/currency";
import { formatPrice as formatPriceBase } from "@/lib/cms/types";

type CurrencyCtx = {
  currency: string;
  setCurrency: (code: string) => void;
  rates: Record<string, number>;
  ratesReady: boolean;
  ratesSource: string;
  convert: (amountNgn: number, to?: string) => number;
  format: (amountNgn: number, to?: string) => string;
};

const CurrencyContext = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const [rates, setRates] = useState<Record<string, number>>({ NGN: 1, USD: 0.00065 });
  const [ratesReady, setRatesReady] = useState(false);
  const [ratesSource, setRatesSource] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/currency/rates");
        const data = await res.json();
        if (cancelled) return;
        if (data?.rates && typeof data.rates === "object") {
          setRates({ NGN: 1, ...data.rates });
          setRatesSource(String(data.source || "live"));
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setRatesReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const convert = useCallback(
    (amountNgn: number, to?: string) =>
      convertFromNgn(amountNgn, to || currency || DEFAULT_DISPLAY_CURRENCY, rates),
    [currency, rates]
  );

  const format = useCallback(
    (amountNgn: number, to?: string) => {
      const code = (to || currency || DEFAULT_DISPLAY_CURRENCY).toUpperCase();
      if (!amountNgn || amountNgn <= 0) return "Price on request";
      const converted = convertFromNgn(amountNgn, code, rates);
      return new Intl.NumberFormat(localeForCurrency(code), {
        style: "currency",
        currency: code,
        maximumFractionDigits: fractionDigitsFor(code),
        minimumFractionDigits: fractionDigitsFor(code) === 0 ? 0 : 2,
      }).format(converted);
    },
    [currency, rates]
  );

  const value = useMemo(
    () => ({
      currency: currency || DEFAULT_DISPLAY_CURRENCY,
      setCurrency,
      rates,
      ratesReady,
      ratesSource,
      convert,
      format,
    }),
    [currency, setCurrency, rates, ratesReady, ratesSource, convert, format]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Safe fallback for rare trees without provider
    return {
      currency: DEFAULT_DISPLAY_CURRENCY,
      setCurrency: () => undefined,
      rates: { NGN: 1, USD: 0.00065 },
      ratesReady: false,
      ratesSource: "none",
      convert: (n: number) => n * 0.00065,
      format: (n: number) => formatPriceBase(n * 0.00065, "USD", "en-US"),
    } satisfies CurrencyCtx;
  }
  return ctx;
}
