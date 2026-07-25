import { create } from "zustand";

export type CursorLabel = "" | "VIEW" | "SHOP" | "DRAG" | "EXPLORE" | "PLAY" | "CLOSE" | "ADD";

type UIState = {
  loaderComplete: boolean;
  setLoaderComplete: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  cursorLabel: CursorLabel;
  setCursorLabel: (label: CursorLabel) => void;
  cursorHover: boolean;
  setCursorHover: (v: boolean) => void;
  recentlyViewed: string[];
  addRecentlyViewed: (id: string) => void;
};

export const useUIStore = create<UIState>((set, get) => ({
  loaderComplete: false,
  setLoaderComplete: (v) => set({ loaderComplete: v }),
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  cursorLabel: "",
  setCursorLabel: (label) => set({ cursorLabel: label }),
  cursorHover: false,
  setCursorHover: (v) => set({ cursorHover: v }),
  recentlyViewed: [],
  addRecentlyViewed: (id) => {
    const prev = get().recentlyViewed.filter((x) => x !== id);
    set({ recentlyViewed: [id, ...prev].slice(0, 8) });
  },
}));
