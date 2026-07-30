import { formatPrice } from "@/lib/cms/types";
import { DELIVERY_FEE_NOTE, deliveryMethodLabel } from "@/lib/checkout/delivery";

export type OrderEmailItem = {
  name: string;
  quantity: number;
  price: number;
  color?: string | null;
  size?: string | null;
  image?: string | null;
};

export type OrderEmailPayload = {
  orderId: string;
  reference: string;
  email: string;
  customerName: string;
  phone?: string | null;
  addressLine: string;
  city: string;
  state?: string | null;
  postal?: string | null;
  country: string;
  items: OrderEmailItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency?: string;
  paidAt?: string | null;
  deliveryMethod?: string | null;
  expectedDeliveryDate?: string | null;
};

const ACCENT = "#c45c26";
const INK = "#111111";
const MUTED = "#6b6b6b";
const WARM = "#f7f3ef";
const BORDER = "#e8e2dc";

function money(n: number, currency = "NGN") {
  return formatPrice(n, currency);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemsRows(items: OrderEmailItem[], currency: string) {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="64" valign="top" style="padding-right:14px;">
                ${
                  item.image
                    ? `<img src="${escapeHtml(item.image)}" width="64" height="80" alt="" style="display:block;object-fit:cover;background:${WARM};" />`
                    : `<div style="width:64px;height:80px;background:${WARM};"></div>`
                }
              </td>
              <td valign="top">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${INK};">${escapeHtml(item.name)}</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">
                  ${escapeHtml([item.size].filter(Boolean).join(" · ") || "Atelier piece")} · Qty ${item.quantity}
                </div>
              </td>
              <td valign="top" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};white-space:nowrap;">
                ${money(item.price * item.quantity, currency)}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");
}

function shell(opts: {
  preheader: string;
  title: string;
  eyebrow: string;
  bodyHtml: string;
  footerNote: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${WARM};color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WARM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:28px 32px 18px;border-bottom:1px solid ${BORDER};">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.28em;color:${ACCENT};">MKoS</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;margin-top:10px;color:${INK};">${escapeHtml(opts.title)}</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};margin-top:8px;">${escapeHtml(opts.eyebrow)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;border-top:1px solid ${BORDER};">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
                ${opts.footerNote}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${ACCENT};margin-top:18px;">
                For Those Who Understand STYLE
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function customerOrderEmailHtml(order: OrderEmailPayload) {
  const currency = order.currency || "NGN";
  const body = `
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;margin:0 0 18px;color:${INK};">
      Dear ${escapeHtml(order.customerName.split(" ")[0] || "client")},
    </p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${MUTED};margin:0 0 24px;">
      Thank you for your order with MKoS. Your payment was received successfully.
      We’re preparing your styles with the same care we put into every atelier finish.
      Please note: orders typically arrive within <strong style="color:${INK};">7–10 business days</strong>.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WARM};margin-bottom:24px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">Order reference</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;margin-top:6px;color:${INK};">${escapeHtml(order.reference)}</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};margin-top:8px;">
            ${order.paidAt ? `Paid ${escapeHtml(new Date(order.paidAt).toLocaleString("en-NG"))}` : "Payment confirmed"}
          </div>
        </td>
      </tr>
    </table>

    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Items</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemsRows(order.items, currency)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};padding:4px 0;">Subtotal</td>
        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};">${money(order.subtotal, currency)}</td>
      </tr>
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};padding:4px 0;">Delivery</td>
        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};">Not included · quoted separately</td>
      </tr>
      <tr>
        <td style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${INK};padding-top:12px;">Total paid</td>
        <td align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${INK};padding-top:12px;">${money(order.total, currency)}</td>
      </tr>
    </table>

    <div style="margin-top:28px;padding-top:20px;border-top:1px solid ${BORDER};">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">Delivery</div>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${INK};margin:8px 0 0;">
        <strong>Estimated arrival:</strong> 7–10 business days<br/>
        <strong>Method:</strong> ${escapeHtml(deliveryMethodLabel(order.deliveryMethod))}<br/>
        ${
          order.expectedDeliveryDate
            ? `<strong>Preferred date:</strong> ${escapeHtml(order.expectedDeliveryDate)}<br/>`
            : ""
        }
        ${escapeHtml(order.customerName)}<br/>
        ${escapeHtml(order.addressLine)}<br/>
        ${escapeHtml([order.city, order.state, order.postal].filter(Boolean).join(", "))}<br/>
        ${escapeHtml(order.country)}
        ${order.phone ? `<br/>${escapeHtml(order.phone)}` : ""}
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};margin:14px 0 0;">
        ${escapeHtml(DELIVERY_FEE_NOTE)}
      </p>
    </div>
  `;

  return shell({
    preheader: `Your MKoS order ${order.reference} is confirmed. Estimated arrival: 7–10 business days.`,
    title: "Order confirmed",
    eyebrow: "Payment received",
    bodyHtml: body,
    footerNote: `Questions about fittings, alterations, or delivery? Reply to this email or WhatsApp the house. Studio: Oniru, Lagos · ${escapeHtml(order.email)}`,
  });
}

export function adminOrderEmailHtml(order: OrderEmailPayload) {
  const currency = order.currency || "NGN";
  const body = `
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${MUTED};margin:0 0 20px;">
      A new paid order just landed. Fulfilment details below.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WARM};margin-bottom:22px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">Paystack reference</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;margin-top:6px;">${escapeHtml(order.reference)}</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;margin-top:10px;color:${INK};">
            <strong>${escapeHtml(order.customerName)}</strong><br/>
            ${escapeHtml(order.email)}
            ${order.phone ? `<br/>${escapeHtml(order.phone)}` : ""}
          </div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;margin-top:14px;color:${ACCENT};">
            ${money(order.total, currency)}
          </div>
        </td>
      </tr>
    </table>

    <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};margin-bottom:8px;">Line items</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemsRows(order.items, currency)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};padding:4px 0;">Subtotal</td>
        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;">${money(order.subtotal, currency)}</td>
      </tr>
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};padding:4px 0;">Delivery</td>
        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;">Not included · quote client</td>
      </tr>
      <tr>
        <td style="font-family:Georgia,'Times New Roman',serif;font-size:20px;padding-top:12px;">Total paid</td>
        <td align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:20px;padding-top:12px;">${money(order.total, currency)}</td>
      </tr>
    </table>

    <div style="margin-top:28px;padding-top:20px;border-top:1px solid ${BORDER};">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">Delivery</div>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;margin:8px 0 0;">
        <strong>Method:</strong> ${escapeHtml(deliveryMethodLabel(order.deliveryMethod))}<br/>
        ${
          order.expectedDeliveryDate
            ? `<strong>Expected date:</strong> ${escapeHtml(order.expectedDeliveryDate)}<br/>`
            : ""
        }
        ${escapeHtml(order.addressLine)}<br/>
        ${escapeHtml([order.city, order.state, order.postal].filter(Boolean).join(", "))}<br/>
        ${escapeHtml(order.country)}
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};margin:14px 0 0;">
        ${escapeHtml(DELIVERY_FEE_NOTE)}
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};margin:14px 0 0;">
        Internal order id: ${escapeHtml(order.orderId)}
      </p>
    </div>
  `;

  return shell({
    preheader: `New paid order ${order.reference} · ${money(order.total, currency)}`,
    title: "New order paid",
    eyebrow: "Admin alert",
    bodyHtml: body,
    footerNote: "Sent automatically from the MKoS storefront when Paystack confirms payment.",
  });
}

/** Sample payload for email preview in admin. */
export function sampleOrderEmailPayload(): OrderEmailPayload {
  return {
    orderId: "00000000-0000-0000-0000-000000000001",
    reference: "mkos_demo_preview",
    email: "client@example.com",
    customerName: "Adaora Okonkwo",
    phone: "08143173661",
    addressLine: "1 Ade Adedeji Close, Ayo Babatunde Crescent",
    city: "Lagos",
    state: "Lagos",
    postal: "101241",
    country: "Nigeria",
    deliveryMethod: "home_delivery",
    expectedDeliveryDate: "2026-08-15",
    items: [
      {
        name: "Abeni Boubou",
        quantity: 1,
        price: 185000,
        color: "Ivory",
        size: "M",
        image: "/images/products/abeni-boubou.jpg",
      },
      {
        name: "Rolly Set",
        quantity: 1,
        price: 165000,
        color: "Black",
        size: "S",
        image: "/images/products/rolly-set.jpg",
      },
    ],
    subtotal: 350000,
    shipping: 0,
    total: 350000,
    currency: "NGN",
    paidAt: new Date().toISOString(),
  };
}
