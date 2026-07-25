"use client";

import { createContext, useContext } from "react";
import type { CmsSnapshot } from "@/lib/cms/types";
import { formatPrice as formatPriceBase } from "@/lib/cms/types";

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

export function useFormatPrice() {
  const cms = useCmsOptional();
  return (price: number) =>
    formatPriceBase(price, cms?.settings.currency ?? "NGN", cms?.settings.locale ?? "en-NG");
}

export function useContent(key: string) {
  const cms = useCms();
  return cms.content[key];
}
