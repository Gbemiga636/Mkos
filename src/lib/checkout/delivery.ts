export type DeliveryMethod = "pickup" | "home_delivery" | "international";

export const DELIVERY_METHODS: {
  value: DeliveryMethod;
  label: string;
  note?: string;
  short: string;
}[] = [
  { value: "pickup", label: "Pickup", short: "Pickup at the Oniru studio" },
  {
    value: "home_delivery",
    label: "Home delivery",
    note: "(Local Orders Only)",
    short: "Dispatch riders — fee quoted by location",
  },
  {
    value: "international",
    label: "International shipping",
    short: "Overseas — fee quoted before dispatch",
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
