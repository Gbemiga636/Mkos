"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useCms } from "@/lib/cms/CmsProvider";
import {
  flutterwaveEncryptCard,
  flutterwaveEncryptSecret,
  flutterwaveGenerateNonce,
  flutterwavePublicEncryptionKey,
} from "@/lib/flutterwaveEncrypt";

type ChargeResult = {
  ok?: boolean;
  error?: string;
  chargeId?: string;
  status?: string;
  reference?: string;
  nextAction?: string | null;
  redirectUrl?: string | null;
  succeeded?: boolean;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value: string) {
  return digitsOnly(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const d = digitsOnly(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function cardBrand(number: string) {
  const n = digitsOnly(number);
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Verve";
  return "";
}

function luhnOk(number: string) {
  const n = digitsOnly(number);
  if (n.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function PaymentCard({
  amountLabel,
  reference,
  customerId,
  onPaid,
  onError,
  onBack,
}: {
  amountLabel: string;
  reference: string;
  customerId: string;
  onPaid: (chargeId?: string) => void;
  onError: (message: string) => void;
  onBack: () => void;
}) {
  const { settings } = useCms();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [busy, setBusy] = useState(false);
  const [chargeId, setChargeId] = useState("");
  const [auth, setAuth] = useState<"pin" | "otp" | "">("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [localError, setLocalError] = useState("");

  const brand = useMemo(() => cardBrand(number), [number]);
  const last4 = digitsOnly(number).slice(-4);
  const logoSrc = settings.logo_url || "/logo/mkos-logo.png";

  async function postCharge(payload: Record<string, unknown>) {
    const res = await fetch("/api/checkout/flutterwave/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as ChargeResult;
    if (!res.ok) {
      throw new Error(data.error || "Payment failed");
    }
    return data;
  }

  function handleNext(data: ChargeResult) {
    if (data.succeeded) {
      onPaid(data.chargeId);
      return;
    }
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }
    const next = String(data.nextAction || "").toLowerCase();
    if (next.includes("pin")) {
      setChargeId(data.chargeId || "");
      setAuth("pin");
      setLocalError("");
      return;
    }
    if (next.includes("otp")) {
      setChargeId(data.chargeId || "");
      setAuth("otp");
      setLocalError("");
      return;
    }
    if (data.status && !["pending", "requires_action"].includes(data.status.toLowerCase())) {
      throw new Error(data.error || `Payment ${data.status}`);
    }
    throw new Error("Payment needs another step. Please try again or use a different card.");
  }

  async function payCard() {
    setLocalError("");
    onError("");
    const pan = digitsOnly(number);
    const exp = digitsOnly(expiry);
    const month = exp.slice(0, 2);
    const year = exp.slice(2);
    const sec = digitsOnly(cvv);
    if (!luhnOk(pan)) {
      setLocalError("Please enter a valid card number.");
      return;
    }
    if (month.length !== 2 || year.length !== 2) {
      setLocalError("Enter expiry as MM/YY.");
      return;
    }
    const mm = Number(month);
    if (mm < 1 || mm > 12) {
      setLocalError("Expiry month must be between 01 and 12.");
      return;
    }
    if (sec.length < 3) {
      setLocalError("Enter the 3 or 4 digit security code.");
      return;
    }
    if (!flutterwavePublicEncryptionKey()) {
      setLocalError("Payment encryption is not configured on this site.");
      return;
    }
    setBusy(true);
    try {
      const card = await flutterwaveEncryptCard({
        number: pan,
        expiryMonth: month,
        expiryYear: year,
        cvv: sec,
      });
      const data = await postCharge({
        reference,
        customerId,
        card,
      });
      handleNext(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setLocalError(message);
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  async function submitPin() {
    if (!chargeId) return;
    const pinDigits = digitsOnly(pin);
    if (pinDigits.length < 4) {
      setLocalError("Enter your 4-digit card PIN.");
      return;
    }
    setBusy(true);
    setLocalError("");
    try {
      const nonce = flutterwaveGenerateNonce();
      const encrypted_pin = await flutterwaveEncryptSecret(pinDigits, nonce);
      const data = await postCharge({
        action: "authorize",
        chargeId,
        kind: "pin",
        nonce,
        encrypted_pin,
      });
      handleNext(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "PIN authorization failed";
      setLocalError(message);
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    if (!chargeId) return;
    const code = otp.trim();
    if (code.length < 4) {
      setLocalError("Enter the OTP sent by your bank.");
      return;
    }
    setBusy(true);
    setLocalError("");
    try {
      const nonce = flutterwaveGenerateNonce();
      const encrypted_otp = await flutterwaveEncryptSecret(code, nonce);
      const data = await postCharge({
        action: "authorize",
        chargeId,
        kind: "otp",
        otp: code,
        nonce,
        encrypted_otp,
      });
      handleNext(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "OTP authorization failed";
      setLocalError(message);
      onError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Image
          src={logoSrc}
          alt={settings.brand_name || "MKoS"}
          width={220}
          height={88}
          className="h-12 w-auto sm:h-14"
          priority
        />
      </div>
      <h2 className="font-display text-2xl">Pay securely</h2>
      <p className="mt-2 text-sm text-mkos-muted">
        Card details are encrypted in your browser before they leave this page. You’ll pay{" "}
        <span className="text-mkos-ink">{amountLabel}</span> now — delivery, if any, is quoted
        separately.
      </p>

      <div className="mt-8 overflow-hidden bg-mkos-ink p-6 text-white shadow-lift sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <Image
            src={logoSrc}
            alt=""
            width={140}
            height={56}
            className="h-8 w-auto brightness-0 invert"
          />
          <p className="font-display text-[10px] tracking-[0.22em] text-mkos-accent uppercase">
            {brand || "Card"}
          </p>
        </div>
        <div className="mt-10 font-display text-xl tracking-[0.28em] sm:text-2xl">
          {digitsOnly(number)
            ? formatCardNumber(number)
            : "••••  ••••  ••••  ••••"}
        </div>
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.2em] text-white/40 uppercase">Name</p>
            <p className="mt-1 font-display text-sm tracking-[0.12em] uppercase">
              {cardName.trim() || "Name on card"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] tracking-[0.2em] text-white/40 uppercase">Expires</p>
            <p className="mt-1 font-display text-sm tracking-[0.12em]">
              {expiry || "MM/YY"}
            </p>
          </div>
        </div>
      </div>

      {auth === "" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
              Name on card
            </span>
            <input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              name="mkos-card-name"
              placeholder="As printed on the card"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="mt-2 h-12 w-full border border-mkos-border bg-mkos-warm/50 px-4 text-sm outline-none transition-shadow focus:border-mkos-accent focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
              Card number
            </span>
            <input
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="ACCT-000015"
              value={formatCardNumber(number)}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              className="mt-2 h-12 w-full border border-mkos-border bg-mkos-warm/50 px-4 font-display tracking-[0.12em] outline-none transition-shadow focus:border-mkos-accent focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
            />
          </label>
          <label>
            <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
              Expiry
            </span>
            <input
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className="mt-2 h-12 w-full border border-mkos-border bg-mkos-warm/50 px-4 outline-none transition-shadow focus:border-mkos-accent focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
            />
          </label>
          <label>
            <span className="font-display text-[10px] tracking-[0.2em] text-mkos-muted uppercase">
              CVV
            </span>
            <input
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, 4))}
              className="mt-2 h-12 w-full border border-mkos-border bg-mkos-warm/50 px-4 outline-none transition-shadow focus:border-mkos-accent focus:shadow-[0_0_0_3px_rgba(196,92,38,0.12)]"
            />
          </label>
        </div>
      )}

      {auth === "pin" && (
        <div className="mt-8 border border-mkos-border bg-mkos-warm/50 p-5">
          <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
            Enter card PIN
          </p>
          <p className="mt-2 text-sm text-mkos-muted">
            Your bank needs the PIN for the card ending {last4 || "••••"}.
          </p>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(digitsOnly(e.target.value).slice(0, 6))}
            className="mt-4 h-12 w-full border border-mkos-border bg-white px-4 tracking-[0.4em] outline-none focus:border-mkos-accent"
          />
        </div>
      )}

      {auth === "otp" && (
        <div className="mt-8 border border-mkos-border bg-mkos-warm/50 p-5">
          <p className="font-display text-[10px] tracking-[0.22em] text-mkos-muted uppercase">
            One-time password
          </p>
          <p className="mt-2 text-sm text-mkos-muted">
            Enter the OTP your bank sent to complete this payment.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\s/g, "").slice(0, 12))}
            className="mt-4 h-12 w-full border border-mkos-border bg-white px-4 tracking-[0.3em] outline-none focus:border-mkos-accent"
          />
        </div>
      )}

      {localError && <p className="mt-4 text-sm text-red-600">{localError}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onBack} disabled={busy}>
          Back
        </Button>
        {auth === "" && (
          <Button size="lg" variant="checkout" disabled={busy} onClick={payCard}>
            {busy ? "Encrypting & charging…" : `Pay ${amountLabel}`}
          </Button>
        )}
        {auth === "pin" && (
          <Button size="lg" variant="checkout" disabled={busy} onClick={submitPin}>
            {busy ? "Authorizing…" : "Confirm PIN"}
          </Button>
        )}
        {auth === "otp" && (
          <Button size="lg" variant="checkout" disabled={busy} onClick={submitOtp}>
            {busy ? "Confirming…" : "Confirm OTP"}
          </Button>
        )}
      </div>
      <p className={cn("mt-5 text-xs leading-relaxed text-mkos-muted")}>
        Payments are processed by Flutterwave. Reference {reference}.
      </p>
    </div>
  );
}
