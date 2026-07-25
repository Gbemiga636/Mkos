"use client";

import { useEffect } from "react";
import { useUIStore, type CursorLabel } from "@/store/ui";

export function useCursorLabel(label: CursorLabel) {
  const setCursorLabel = useUIStore((s) => s.setCursorLabel);
  const setCursorHover = useUIStore((s) => s.setCursorHover);

  useEffect(() => {
    return () => {
      setCursorLabel("");
      setCursorHover(false);
    };
  }, [setCursorLabel, setCursorHover]);

  return {
    onMouseEnter: () => {
      setCursorLabel(label);
      setCursorHover(true);
    },
    onMouseLeave: () => {
      setCursorLabel("");
      setCursorHover(false);
    },
  };
}
