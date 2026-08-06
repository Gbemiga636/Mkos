"use client";

import { createContext, useContext } from "react";
import type { CmsSnapshot } from "@/lib/cms/types";
import { formatPrice as formatPriceBase } from "@/lib/cms/types";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import {
  fractionDigitsFor,
  localeForCurrency,
} from "@/lib/currency/currencies";

const CmsContext = createContext<CmsSnapshot | null>(null);

export function CmsProvider({
  value,
  children,
}: {
  value: CmsSnapshot;
  children: React.ReactNode;
}) {
  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error("useCms must be used within CmsProvider");
  }
  return ctx;
}

export function useCmsOptional() {
  return useContext(CmsContext);
}

export type FormatPriceOpts = {
  /** Explicit USD from admin — preferred when shopper currency is USD (or as USD base for FX). */
  usd?: number | null;
};

/**
 * Formats catalogue prices into the shopper's currency (default USD).
 * - If `usd` is set and currency is USD → use that exact dollar amount
 * - If `usd` is set and currency is other → convert via USD rate vs NGN rates
 * - If only Naira → live FX from NGN (including to USD)
 */
export function useFormatPrice() {
  const { currency, rates, format } = useCurrency();

  return (priceNgn: number, opts?: FormatPriceOpts) => {
    const code = (currency || "USD").toUpperCase();
    const usd = opts?.usd != null && Number(opts.usd) > 0 ? Number(opts.usd) : null;

    if (!priceNgn || priceNgn <= 0) {
      if (usd == null) return "Price on request";
    }

    if (usd != null) {
      if (code === "USD") {
        return new Intl.NumberFormat(localeForCurrency("USD"), {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(usd);
      }
      if (code === "NGN" && priceNgn > 0) {
        return format(priceNgn);
      }
      // Convert USD → target using NGN rates: target = usd * (rate_target / rate_usd)
      const rateUsd = rates.USD;
      const rateTarget = rates[code];
      if (rateUsd && rateTarget && rateUsd > 0) {
        const converted = usd * (rateTarget / rateUsd);
        return new Intl.NumberFormat(localeForCurrency(code), {
          style: "currency",
          currency: code,
          maximumFractionDigits: fractionDigitsFor(code),
          minimumFractionDigits: fractionDigitsFor(code) === 0 ? 0 : 2,
        }).format(converted);
      }
    }

    if (!priceNgn || priceNgn <= 0) return "Price on request";
    return format(priceNgn);
  };
}

export function useCatalogFormatPrice() {
  const cms = useCmsOptional();
  return (price: number) =>
    formatPriceBase(price, cms?.settings.currency ?? "NGN", cms?.settings.locale ?? "en-NG");
}

export function useContent(key: string) {
  const cms = useCms();
  return cms.content[key];
}

/** Helper for product objects */
export function productPriceOpts(product: { priceUsd?: number }) {
  return { usd: product.priceUsd ?? null };
}
