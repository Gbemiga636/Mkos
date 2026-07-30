"use client";

import { useEffect } from "react";
import { useUIStore, type CursorLabel } from "@/store/ui";

function normalizeCursorLabel(label: CursorLabel): CursorLabel {
  // Never show SHOP — always EXPLORE
  if (label === "SHOP") return "EXPLORE";
  return label;
}

export function useCursorLabel(label: CursorLabel) {
  const setCursorLabel = useUIStore((s) => s.setCursorLabel);
  const setCursorHover = useUIStore((s) => s.setCursorHover);
  const resolved = normalizeCursorLabel(label);

  useEffect(() => {
    return () => {
      setCursorLabel("");
      setCursorHover(false);
    };
  }, [setCursorLabel, setCursorHover]);

  return {
    onMouseEnter: () => {
      setCursorLabel(resolved);
      setCursorHover(true);
    },
    onMouseLeave: () => {
      setCursorLabel("");
      setCursorHover(false);
    },
  };
}
