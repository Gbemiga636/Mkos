"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_IMAGE_FOCUS,
  normalizeFocus,
  objectPositionCss,
  type ImageFocus,
} from "@/lib/media/imageFocus";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  value?: ImageFocus | null;
  onChange: (focus: ImageFocus) => void;
  onClose: () => void;
};

/** Drag the image inside a 3/4 product card frame to set object-position. */
export function ImageFocusEditor({ src, value, onChange, onClose }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<ImageFocus>(() => normalizeFocus(value));
  const dragging = useRef(false);

  useEffect(() => {
    setFocus(normalizeFocus(value));
  }, [value, src]);

  const setFromPoint = useCallback((clientX: number, clientY: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setFocus(normalizeFocus({ x, y }));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      setFromPoint(e.clientX, e.clientY);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setFromPoint]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-mkos-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto border border-mkos-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-mkos-border px-5 py-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.22em] text-mkos-accent uppercase">
              Frame position
            </p>
            <h3 className="font-display text-lg tracking-tight">Fit the Quick View crop</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-display text-[10px] tracking-[0.18em] text-mkos-muted uppercase"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-5 p-5">
          <p className="text-sm text-mkos-muted">
            Drag inside the frame to choose which part of the photo stays visible. This matches the
            product card / Quick View crop on the site.
          </p>

          <div
            ref={frameRef}
            onPointerDown={(e) => {
              dragging.current = true;
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              setFromPoint(e.clientX, e.clientY);
            }}
            className="relative mx-auto aspect-[3/4] w-full max-w-sm cursor-crosshair touch-none overflow-hidden border border-mkos-border bg-mkos-warm select-none"
          >
            <Image
              src={src}
              alt=""
              fill
              draggable={false}
              sizes="400px"
              className="pointer-events-none object-cover"
              style={{ objectPosition: objectPositionCss(focus) }}
            />
            <div
              className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-mkos-accent/80 shadow"
              style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
            />
            <div className="pointer-events-none absolute inset-x-3 bottom-3">
              <div className="bg-white/90 px-3 py-2 text-center font-display text-[9px] tracking-[0.22em] uppercase">
                Quick View preview
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-mkos-muted">
              Horizontal
              <input
                type="range"
                min={0}
                max={100}
                value={focus.x}
                onChange={(e) => setFocus((f) => ({ ...f, x: Number(e.target.value) }))}
                className="mt-2 w-full accent-mkos-accent"
              />
            </label>
            <label className="text-xs text-mkos-muted">
              Vertical
              <input
                type="range"
                min={0}
                max={100}
                value={focus.y}
                onChange={(e) => setFocus((f) => ({ ...f, y: Number(e.target.value) }))}
                className="mt-2 w-full accent-mkos-accent"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["Center", DEFAULT_IMAGE_FOCUS],
                ["Top", { x: 50, y: 20 }],
                ["Bottom", { x: 50, y: 80 }],
                ["Left", { x: 20, y: 50 }],
                ["Right", { x: 80, y: 50 }],
              ] as const
            ).map(([label, preset]) => (
              <button
                key={label}
                type="button"
                onClick={() => setFocus(normalizeFocus(preset))}
                className={cn(
                  "h-9 border px-3 font-display text-[9px] tracking-[0.14em] uppercase",
                  focus.x === preset.x && focus.y === preset.y
                    ? "border-mkos-ink bg-mkos-ink text-white"
                    : "border-mkos-border"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 border-t border-mkos-border pt-4">
            <button
              type="button"
              onClick={() => {
                onChange(normalizeFocus(focus));
                onClose();
              }}
              className="h-11 flex-1 bg-mkos-ink font-display text-[11px] tracking-[0.18em] text-white uppercase"
            >
              Apply position
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
