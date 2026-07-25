import { Resend } from "resend";
import {
  adminOrderEmailHtml,
  customerOrderEmailHtml,
  type OrderEmailPayload,
} from "@/lib/email/orderEmails";
import { orderNotifyEmail, resendFrom } from "@/lib/paystack";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendOrderEmails(order: OrderEmailPayload) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped order emails");
    return { sent: false, reason: "missing_key" as const };
  }

  const from = resendFrom();
  const adminTo = orderNotifyEmail();
  const customerHtml = customerOrderEmailHtml(order);
  const adminHtml = adminOrderEmailHtml(order);

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: order.email,
      subject: `Order confirmed · ${order.reference} · MKOS`,
      html: customerHtml,
    }),
    resend.emails.send({
      from,
      to: adminTo,
      replyTo: order.email,
      subject: `New paid order · ${order.reference} · ${order.customerName}`,
      html: adminHtml,
    }),
  ]);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => String(r.reason));

  // Also capture Resend API error objects from fulfilled responses
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.error) {
      errors.push(String(r.value.error.message || r.value.error));
    }
  }

  if (errors.length) {
    console.warn("[email] partial failure", errors);
  }

  return { sent: errors.length < 2, errors };
}
