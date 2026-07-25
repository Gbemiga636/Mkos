import { create } from "zustand";

export type CursorLabel = "" | "VIEW" | "SHOP" | "DRAG" | "EXPLORE" | "PLAY" | "CLOSE" | "ADD";

type UIState = {
  loaderComplete: boolean;
  setLoaderComplete: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  authOpen: boolean;
  authMode: "signin" | "signup";
  openAuth: (mode?: "signin" | "signup") => void;
  closeAuth: () => void;
  cursorLabel: CursorLabel;
  setCursorLabel: (label: CursorLabel) => void;
  cursorHover: boolean;
  setCursorHover: (v: boolean) => void;
  recentlyViewed: string[];
  addRecentlyViewed: (id: string) => void;
  setRecentlyViewed: (ids: string[]) => void;
  routeLoading: boolean;
  setRouteLoading: (v: boolean) => void;
};

export const useUIStore = create<UIState>((set, get) => ({
  loaderComplete: false,
  setLoaderComplete: (v) => set({ loaderComplete: v }),
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  authOpen: false,
  authMode: "signin",
  openAuth: (mode = "signin") => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),
  cursorLabel: "",
  setCursorLabel: (label) => set({ cursorLabel: label }),
  cursorHover: false,
  setCursorHover: (v) => set({ cursorHover: v }),
  recentlyViewed: [],
  addRecentlyViewed: (id) => {
    const prev = get().recentlyViewed.filter((x) => x !== id);
    set({ recentlyViewed: [id, ...prev].slice(0, 8) });
  },
  setRecentlyViewed: (ids) => set({ recentlyViewed: ids.slice(0, 8) }),
  routeLoading: false,
  setRouteLoading: (v) => set({ routeLoading: v }),
}));
