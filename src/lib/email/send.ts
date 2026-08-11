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
import {
  adminBespokeEmailHtml,
  clientBespokeEmailHtml,
  type BespokeInquiryPayload,
} from "@/lib/email/bespokeEmails";
import {
  adminBridalEmailHtml,
  clientBridalEmailHtml,
  type BridalBriefPayload,
} from "@/lib/email/bridalEmails";
import { orderNotifyEmails, resendFrom } from "@/lib/paystack";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

type SendResult = PromiseSettledResult<{ error: unknown }>;

async function sendAdminAlert(
  resend: Resend,
  opts: {
    from: string;
    replyTo?: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: Buffer }[];
  }
): Promise<SendResult[]> {
  const recipients = orderNotifyEmails();
  return Promise.allSettled(
    recipients.map((to) =>
      resend.emails.send({
        from: opts.from,
        to,
        replyTo: opts.replyTo,
        subject: opts.subject,
        html: opts.html,
        attachments: opts.attachments,
      })
    )
  ) as Promise<SendResult[]>;
}

function collectErrors(results: SendResult[]) {
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === "rejected") errors.push(String(r.reason));
    if (r.status === "fulfilled" && r.value.error) {
      const err = r.value.error as { message?: string };
      errors.push(String(err.message || r.value.error));
    }
  }
  return errors;
}

export async function sendOrderEmails(order: OrderEmailPayload) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped order emails");
    return { sent: false, reason: "missing_key" as const };
  }

  const from = resendFrom();
  const customerHtml = customerOrderEmailHtml(order);
  const adminHtml = adminOrderEmailHtml(order);

  const results = (await Promise.allSettled([
    resend.emails.send({
      from,
      to: order.email,
      subject: `Order confirmed · ${order.reference} · MKoS`,
      html: customerHtml,
    }),
    ...orderNotifyEmails().map((to) =>
      resend.emails.send({
        from,
        to,
        replyTo: order.email,
        subject: `New paid order · ${order.reference} · ${order.customerName}`,
        html: adminHtml,
      })
    ),
  ])) as SendResult[];

  const errors = collectErrors(results);
  if (errors.length) console.warn("[email] partial failure", errors);
  return { sent: errors.length === 0, errors };
}

/** Admin alert + client confirmation for MKoS Experience inquiries */
export async function sendExperienceInquiryEmails(inquiry: ExperienceInquiryPayload) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped experience emails");
    return { sent: false, reason: "missing_key" as const };
  }

  const from = resendFrom();
  const isGlam = inquiry.kind === "full_glam";
  const adminSubject = isGlam
    ? `Full Glam consultation · ${inquiry.fullName}`
    : `MKoS Experience content · ${inquiry.fullName}`;
  const clientSubject = isGlam
    ? `Your Full Glam request · MKoS`
    : `Your MKoS Experience preference · MKoS`;

  const adminResults = await sendAdminAlert(resend, {
    from,
    replyTo: inquiry.email,
    subject: adminSubject,
    html: adminExperienceEmailHtml(inquiry),
  });

  const clientResults = (await Promise.allSettled([
    resend.emails.send({
      from,
      to: inquiry.email,
      subject: clientSubject,
      html: clientExperienceEmailHtml(inquiry),
    }),
  ])) as SendResult[];

  const errors = collectErrors([...adminResults, ...clientResults]);
  if (errors.length) console.warn("[email] experience inquiry partial failure", errors);
  return { sent: errors.length === 0, errors };
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
  const resendAttachments = attachments.map((a) => ({
    filename: a.filename,
    content: a.content,
  }));

  const adminResults = await sendAdminAlert(resend, {
    from,
    replyTo: brief.email,
    subject: `Client Style Brief · ${brief.fullName}`,
    html: adminStyleBriefEmailHtml(brief),
    attachments: resendAttachments.length ? resendAttachments : undefined,
  });

  const clientResults = (await Promise.allSettled([
    resend.emails.send({
      from,
      to: brief.email,
      subject: `Your Client Style Brief · MKoS`,
      html: clientStyleBriefEmailHtml(brief),
    }),
  ])) as SendResult[];

  const errors = collectErrors([...adminResults, ...clientResults]);
  if (errors.length) console.warn("[email] style brief partial failure", errors);
  return { sent: errors.length === 0, errors };
}

/** Admin alert (+ attachments) and client confirmation for Bespoke / Custom Wear */
export async function sendBespokeEmails(
  brief: BespokeInquiryPayload,
  attachments: StyleBriefAttachment[] = []
) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped bespoke emails");
    return { sent: false, reason: "missing_key" as const };
  }

  const from = resendFrom();
  const resendAttachments = attachments.map((a) => ({
    filename: a.filename,
    content: a.content,
  }));

  const adminResults = await sendAdminAlert(resend, {
    from,
    replyTo: brief.email,
    subject: `Bespoke / Custom Wear · ${brief.fullName}`,
    html: adminBespokeEmailHtml(brief),
    attachments: resendAttachments.length ? resendAttachments : undefined,
  });

  const clientResults = (await Promise.allSettled([
    resend.emails.send({
      from,
      to: brief.email,
      subject: `Your Bespoke brief · MKoS`,
      html: clientBespokeEmailHtml(brief),
    }),
  ])) as SendResult[];

  const errors = collectErrors([...adminResults, ...clientResults]);
  if (errors.length) console.warn("[email] bespoke inquiry partial failure", errors);
  return { sent: errors.length === 0, errors };
}

/** Admin alert and client confirmation for Bridal briefs */
export async function sendBridalEmails(brief: BridalBriefPayload) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipped bridal emails");
    return { sent: false, reason: "missing_key" as const };
  }

  const from = resendFrom();

  const adminResults = await sendAdminAlert(resend, {
    from,
    replyTo: brief.email,
    subject: `Bridal Brief · ${brief.primaryContactName}`,
    html: adminBridalEmailHtml(brief),
  });

  const clientResults = (await Promise.allSettled([
    resend.emails.send({
      from,
      to: brief.email,
      subject: `Your Bridal brief · MKoS`,
      html: clientBridalEmailHtml(brief),
    }),
  ])) as SendResult[];

  const errors = collectErrors([...adminResults, ...clientResults]);
  if (errors.length) console.warn("[email] bridal inquiry partial failure", errors);
  return { sent: errors.length === 0, errors };
}
