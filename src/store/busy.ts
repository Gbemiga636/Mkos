"use client";

import { create } from "zustand";

type BusyState = {
  busy: boolean;
  label: string;
  hold: number;
  pulse: () => void;
  withBusy: <T>(fn: () => Promise<T>, label?: string) => Promise<T>;
};

export const useBusyStore = create<BusyState>((set, get) => ({
  busy: false,
  label: "Working…",
  hold: 0,
  pulse: () => {
    set({ busy: true, label: "Working…" });
    window.setTimeout(() => {
      if (get().hold === 0) set({ busy: false });
    }, 500);
  },
  withBusy: async (fn, label = "Working…") => {
    set((s) => ({ busy: true, label, hold: s.hold + 1 }));
    try {
      return await fn();
    } finally {
      set((s) => {
        const hold = Math.max(0, s.hold - 1);
        return { hold, busy: hold > 0, label: hold > 0 ? s.label : "Working…" };
      });
    }
  },
}));
