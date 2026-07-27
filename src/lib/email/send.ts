import { Resend } from "resend";
import {
  adminOrderEmailHtml,
  customerOrderEmailHtml,
  type OrderEmailPayload,
} from "@/lib/email/orderEmails";
import {
  adminExperienceEmailHtml,
  clientExperienceEmailHtml,
  type ExperienceInquiryPayload,
} from "@/lib/email/experienceEmails";
import {
  adminStyleBriefEmailHtml,
  clientStyleBriefEmailHtml,
  type StyleBriefPayload,
} from "@/lib/email/styleBriefEmails";
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
      subject: `Order confirmed · ${order.reference} · MKoS`,
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

/** Admin alert + client confirmation for MKoS Experience inquiries */
export async function sendExperienceInquiryEmails(inquiry: ExperienceInquiryPayload) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped experience emails");
    return { sent: false, reason: "missing_key" as const };
  }

  const from = resendFrom();
  const adminTo = orderNotifyEmail();
  const isGlam = inquiry.kind === "full_glam";
  const adminSubject = isGlam
    ? `Full Glam consultation · ${inquiry.fullName}`
    : `MKoS Experience content · ${inquiry.fullName}`;
  const clientSubject = isGlam
    ? `Your Full Glam request · MKoS`
    : `Your MKoS Experience preference · MKoS`;

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: adminTo,
      replyTo: inquiry.email,
      subject: adminSubject,
      html: adminExperienceEmailHtml(inquiry),
    }),
    resend.emails.send({
      from,
      to: inquiry.email,
      subject: clientSubject,
      html: clientExperienceEmailHtml(inquiry),
    }),
  ]);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => String(r.reason));

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.error) {
      errors.push(String(r.value.error.message || r.value.error));
    }
  }

  if (errors.length) {
    console.warn("[email] experience inquiry partial failure", errors);
  }

  return { sent: errors.length < 2, errors };
}

export type StyleBriefAttachment = {
  filename: string;
  content: Buffer;
};

/** Admin alert (+ attachments) and client confirmation for Client Style Brief */
export async function sendStyleBriefEmails(
  brief: StyleBriefPayload,
  attachments: StyleBriefAttachment[] = []
) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped style brief emails");
    return { sent: false, reason: "missing_key" as const };
  }

  const from = resendFrom();
  const adminTo = orderNotifyEmail();
  const resendAttachments = attachments.map((a) => ({
    filename: a.filename,
    content: a.content,
  }));

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: adminTo,
      replyTo: brief.email,
      subject: `Client Style Brief · ${brief.fullName}`,
      html: adminStyleBriefEmailHtml(brief),
      attachments: resendAttachments.length ? resendAttachments : undefined,
    }),
    resend.emails.send({
      from,
      to: brief.email,
      subject: `Your Client Style Brief · MKoS`,
      html: clientStyleBriefEmailHtml(brief),
    }),
  ]);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => String(r.reason));

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.error) {
      errors.push(String(r.value.error.message || r.value.error));
    }
  }

  if (errors.length) {
    console.warn("[email] style brief partial failure", errors);
  }

  return { sent: errors.length < 2, errors };
}
