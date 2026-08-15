import { cn } from "@/lib/utils";

export function UsDutyNotice({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="us-duty-title"
      className={cn("border border-mkos-border bg-mkos-warm/50 p-5 sm:p-6", className)}
    >
      <p className="font-display text-[11px] tracking-[0.28em] text-mkos-accent uppercase">
        U.S. Important Shipping Update
      </p>
      <h3
        id="us-duty-title"
        className="mt-3 font-display text-xl font-medium tracking-tight text-mkos-ink"
      >
        17% U.S. import duty
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
        The U.S. has introduced a 17% import duty on international orders. This duty is applied by
        U.S. customs at delivery.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-mkos-muted">
        It is separate from your MKoS product total and any shipping quote. Your carrier or customs
        broker may collect it before releasing the parcel.
      </p>
      <a
        href="/shipping"
        className="mt-4 inline-block font-display text-[10px] tracking-[0.2em] text-mkos-ink uppercase underline underline-offset-4"
      >
        Shipping details
      </a>
    </section>
  );
}
