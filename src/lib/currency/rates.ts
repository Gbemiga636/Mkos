import {
  CATALOG_CURRENCY,
  DEFAULT_DISPLAY_CURRENCY,
  WORLD_CURRENCIES,
} from "@/lib/currency/currencies";

export type RatesPayload = {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
  source: string;
};

/** Fallback USD per 1 NGN approx — used only if live FX fails. */
const FALLBACK_NGN_RATES: Record<string, number> = {
  NGN: 1,
  USD: 0.00065,
  EUR: 0.0006,
  GBP: 0.00051,
  CAD: 0.00089,
  AUD: 0.00099,
  GHS: 0.01,
  KES: 0.084,
  ZAR: 0.012,
  AED: 0.0024,
  INR: 0.054,
};

let memoryCache: { at: number; data: RatesPayload } | null = null;
const CACHE_MS = 1000 * 60 * 60; // 1 hour

async function fetchLiveNgnRates(): Promise<RatesPayload | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/NGN", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    if (json.result !== "success" || !json.rates) return null;
    const rates: Record<string, number> = { NGN: 1 };
    for (const c of WORLD_CURRENCIES) {
      const v = json.rates[c.code];
      if (typeof v === "number" && v > 0) rates[c.code] = v;
    }
    return {
      base: CATALOG_CURRENCY,
      rates,
      fetchedAt: json.time_last_update_utc || new Date().toISOString(),
      source: "open.er-api.com",
    };
  } catch {
    return null;
  }
}

export async function getNgnRates(): Promise<RatesPayload> {
  if (memoryCache && Date.now() - memoryCache.at < CACHE_MS) {
    return memoryCache.data;
  }
  const live = await fetchLiveNgnRates();
  const data: RatesPayload =
    live ??
    ({
      base: CATALOG_CURRENCY,
      rates: { ...FALLBACK_NGN_RATES },
      fetchedAt: new Date().toISOString(),
      source: "fallback",
    } satisfies RatesPayload);

  // Ensure defaults always present
  data.rates.NGN = 1;
  if (!data.rates.USD) data.rates.USD = FALLBACK_NGN_RATES.USD;

  memoryCache = { at: Date.now(), data };
  return data;
}

export function convertFromNgn(
  amountNgn: number,
  toCurrency: string,
  rates: Record<string, number>
) {
  if (!amountNgn || amountNgn <= 0) return 0;
  const code = (toCurrency || DEFAULT_DISPLAY_CURRENCY).toUpperCase();
  if (code === "NGN") return amountNgn;
  const rate = rates[code];
  if (!rate || rate <= 0) {
    const usd = rates.USD || FALLBACK_NGN_RATES.USD;
    return amountNgn * usd;
  }
  return amountNgn * rate;
}
