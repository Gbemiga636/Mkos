export type DeliveryMethod = "pickup" | "home_delivery" | "international";

export const DELIVERY_METHODS: {
  value: DeliveryMethod;
  label: string;
  note?: string;
  short: string;
}[] = [
  {
    value: "pickup",
    label: "Pick Up",
    short:
      "Same-day pickup may be available depending on your size and item availability. Please contact us in advance to confirm.",
  },
  {
    value: "home_delivery",
    label: "Home Delivery",
    short:
      "Delivery fees are the responsibility of the customer and will be quoted based on your location before dispatch.",
  },
  {
    value: "international",
    label: "International Shipping",
    short:
      "For international orders, please contact us if you have a preferred shipping or delivery option. We’ll be happy to discuss available options with you.",
  },
];

export const DELIVERY_FEE_NOTE =
  "Home delivery (via our dispatch riders) and international delivery attract additional charges, which are separate from the cost of your orders and will be communicated and paid before delivery.";

export const STUDIO_PICKUP_ADDRESS =
  "MKoS Studio · 1, Ade Adedeji Close, Ayo Babatunde Crescent, Oniru, Lagos, Nigeria";

export function deliveryMethodLabel(method?: string | null) {
  return DELIVERY_METHODS.find((m) => m.value === method)?.label ?? method ?? "—";
}

export function isDeliveryMethod(v: unknown): v is DeliveryMethod {
  return v === "pickup" || v === "home_delivery" || v === "international";
}
