"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { scrollToTopSmooth } from "@/components/experience/SmoothScroll";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.55);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          initial={{ opacity: 0, y: 18, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.92 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTopSmooth}
          className="fixed bottom-5 left-5 z-[70] flex h-12 w-12 items-center justify-center border border-mkos-border bg-white text-mkos-ink shadow-[0_16px_40px_-18px_rgba(0,0,0,0.45)] transition-colors hover:border-mkos-accent hover:text-mkos-accent sm:bottom-8 sm:left-8"
        >
          <FontAwesomeIcon icon={faArrowUp} className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
