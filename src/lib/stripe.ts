import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
