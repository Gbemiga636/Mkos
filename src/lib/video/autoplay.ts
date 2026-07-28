/** Shared muted-inline autoplay helpers (Safari / iOS). */

const registry = new Set<HTMLVideoElement>();
let globalUnlockBound = false;

export function isIosLike() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return (
    isIosLike() ||
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

export function registerAutoplayVideo(el: HTMLVideoElement) {
  registry.add(el);
  return () => {
    registry.delete(el);
  };
}

export function setupInlineVideo(el: HTMLVideoElement) {
  el.controls = false;
  el.muted = true;
  el.defaultMuted = true;
  el.playsInline = true;
  el.disablePictureInPicture = true;
  el.setAttribute("muted", "");
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "true");
  el.setAttribute("disablepictureinpicture", "");
  el.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback");
  el.removeAttribute("controls");
}

export async function tryPlayInline(el: HTMLVideoElement): Promise<boolean> {
  setupInlineVideo(el);
  if (!el.paused && el.readyState >= 2) return true;

  try {
    const playPromise = el.play();
    if (playPromise) await playPromise;
    return !el.paused;
  } catch {
    return false;
  }
}

export function playAllAutoplayVideos() {
  registry.forEach((el) => {
    void tryPlayInline(el);
  });
}

/** First scroll / touch on iOS unlocks all ambient videos. */
export function bindGlobalAutoplayUnlock() {
  if (globalUnlockBound || typeof window === "undefined") return;
  globalUnlockBound = true;

  const unlock = () => playAllAutoplayVideos();

  window.addEventListener("touchstart", unlock, { passive: true, capture: true });
  window.addEventListener("touchend", unlock, { passive: true, capture: true });
  window.addEventListener("scroll", unlock, { passive: true, capture: true });
  window.addEventListener("click", unlock, { passive: true, capture: true });
  window.addEventListener("mkos:loader-complete", unlock);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") unlock();
  });
}

export const LOADER_COMPLETE_EVENT = "mkos:loader-complete";

export function notifyLoaderComplete() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOADER_COMPLETE_EVENT));
  playAllAutoplayVideos();
}
