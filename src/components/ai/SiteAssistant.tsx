"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useCms } from "@/lib/cms/CmsProvider";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Help me find something for a wedding",
  "What’s special about MKoS Men?",
  "Show me women’s ready-to-wear",
  "Where is the studio?",
];

export function SiteAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Welcome to MKoS. I can help you find pieces, explain collections, share studio details, or guide you through the shop.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const openCart = useCartStore((s) => s.open);
  const { products } = useCms();

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              data.error?.includes("OPENAI_API_KEY")
                ? "The AI key isn’t configured yet. Add OPENAI_API_KEY to .env.local and restart the server."
                : data.error || "I couldn’t reply just now — try again in a moment.",
          },
        ]);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);

      const actions = data.actions as
        | { navigate?: string; products?: string[]; openCart?: boolean }
        | undefined;
      if (actions?.openCart) openCart();
      if (actions?.navigate) {
        setTimeout(() => {
          setOpen(false);
          router.push(actions.navigate!);
        }, 400);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection issue — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestedProducts = messages.length
    ? products.filter((p) =>
        messages[messages.length - 1]?.content?.toLowerCase().includes(p.name.toLowerCase())
      ).slice(0, 3)
    : [];

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-5 bottom-5 z-[70] flex h-14 items-center gap-2 bg-black px-5 text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.55)] sm:right-8 sm:bottom-8",
          open && "pointer-events-none opacity-0"
        )}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Open MKoS assistant"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#c45c26] opacity-60" />
          <span className="relative h-2 w-2 rounded-full bg-[#c45c26]" />
        </span>
        <span className="font-display text-[11px] tracking-[0.2em]">Ask MKoS</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-h-[min(78vh,640px)] w-auto max-w-md flex-col overflow-hidden border border-mkos-border bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] sm:inset-x-auto sm:right-8 sm:bottom-8 sm:w-[400px]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-mkos-border bg-mkos-ink px-5 py-4 text-white">
              <div>
                <p className="font-display text-[10px] tracking-[0.28em] text-white/50 uppercase">
                  Concierge
                </p>
                <p className="mt-1 font-display text-lg tracking-tight">Ask MKoS</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-display text-[11px] tracking-[0.18em] text-white/70 uppercase hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fafafa_0%,#fff_30%)] px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[88%] px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-black text-white"
                        : "border border-mkos-border bg-white text-mkos-ink"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
                  Thinking…
                </p>
              )}
              {suggestedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestedProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className="border border-mkos-border bg-white px-3 py-2 text-xs hover:border-mkos-ink"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
              {messages.length < 3 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="border border-mkos-border bg-white px-3 py-2 text-left text-xs text-mkos-muted transition-colors hover:border-mkos-ink hover:text-mkos-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              className="border-t border-mkos-border bg-white p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about style, fit, studio…"
                  className="h-12 flex-1 border border-mkos-border bg-mkos-warm/40 px-4 text-sm outline-none focus:border-mkos-ink focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-12 bg-black px-5 font-display text-[11px] tracking-[0.18em] text-white uppercase disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
