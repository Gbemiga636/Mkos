"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EditModeContext = createContext(false);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantsEdit = params.get("mkos_edit") === "1";
    const inFrame = window.self !== window.top;
    if (!wantsEdit || !inFrame) return;

    fetch("/api/admin/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setEnabled(true);
          document.documentElement.classList.add("mkos-edit-mode");
          // Skip intro gate so hero content is visible while editing
          import("@/store/ui").then(({ useUIStore }) => {
            useUIStore.getState().setLoaderComplete(true);
          });
        }
      })
      .catch(() => {});

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "mkos-reload-preview") {
        window.location.reload();
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      document.documentElement.classList.remove("mkos-edit-mode");
    };
  }, []);

  return <EditModeContext.Provider value={enabled}>{children}</EditModeContext.Provider>;
}

export function useEditMode() {
  return useContext(EditModeContext);
}

export function EditableSection({
  cmsKey,
  label,
  children,
  className,
}: {
  cmsKey: string;
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const edit = useEditMode();

  if (!edit) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      data-cms-key={cmsKey}
      className={cn(
        "group/edit relative outline outline-2 outline-offset-[-2px] outline-transparent transition-[outline-color]",
        "hover:outline-mkos-accent cursor-pointer",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage(
          { type: "mkos-edit-section", key: cmsKey, label: label || cmsKey },
          window.location.origin
        );
      }}
    >
      <span className="pointer-events-none absolute top-3 left-3 z-[80] bg-mkos-accent px-2.5 py-1 font-display text-[9px] tracking-[0.2em] text-white uppercase opacity-90 shadow-lg group-hover/edit:opacity-100">
        {label || cmsKey} · click to edit
      </span>
      <div className="pointer-events-none">{children}</div>
    </div>
  );
}
