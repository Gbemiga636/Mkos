import { siteUrl } from "@/lib/siteUrl";

/** Shared confirmation copy sent to the client for every MKoS brief form. */
export const BRIEF_CONFIRMATION_COPY = {
  opening: "Thank you for sharing your vision with MKoS.",
  body: "Your brief has been received, and we’ll be in touch shortly to schedule your consultation and explore how we can bring your vision to life.",
  closing: "Welcome to the MKoS experience.",
} as const;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value?: string | null) {
  if (!value) return "";
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b6b6b;font-size:11px;letter-spacing:0.12em;width:34%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;font-size:15px;white-space:pre-wrap;">${escapeHtml(value)}</td>
  </tr>`;
}

/**
 * Client-facing confirmation for Bespoke, Bridal and Client Style Brief
 * submissions. Mirrors the on-site brief success page.
 */
export function clientBriefConfirmationHtml(opts: { name: string; service: string }) {
  const collectionsUrl = `${siteUrl()}/#collections`;
  const firstName = opts.name.trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Dear ${firstName},` : "Hello,";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;font-size:1px;color:#f7f4ef;">${escapeHtml(
    BRIEF_CONFIRMATION_COPY.opening
  )}</div>
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111;color:#fff;padding:28px 32px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.28em;opacity:0.65;">MKoS · ${escapeHtml(
        opts.service
      )}</p>
      <h1 style="margin:12px 0 0;font-size:26px;font-weight:500;letter-spacing:-0.02em;">Your brief has been received</h1>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid rgba(17,17,17,0.08);">
      <p style="margin:0 0 18px;color:#111;font-size:15px;line-height:1.6;">${escapeHtml(
        greeting
      )}</p>
      <p style="margin:0 0 16px;color:#111;font-size:16px;line-height:1.7;">${escapeHtml(
        BRIEF_CONFIRMATION_COPY.opening
      )}</p>
      <p style="margin:0 0 16px;color:#6b6b6b;font-size:15px;line-height:1.7;">${escapeHtml(
        BRIEF_CONFIRMATION_COPY.body
      )}</p>
      <p style="margin:0 0 28px;color:#111;font-size:17px;line-height:1.6;">${escapeHtml(
        BRIEF_CONFIRMATION_COPY.closing
      )}</p>

      <table style="width:100%;border-collapse:collapse;">
        ${row("Name", opts.name)}
        ${row("Service", opts.service)}
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 0;">
        <tr>
          <td style="background:#111;">
            <a href="${collectionsUrl}" style="display:inline-block;padding:14px 26px;color:#ffffff !important;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">Shop MKoS</a>
          </td>
        </tr>
      </table>
    </div>
    <p style="margin:20px 0 0;text-align:center;color:#999;font-size:11px;letter-spacing:0.2em;">MKoS — My Kind of Style</p>
    <p style="margin:10px 0 0;text-align:center;color:#999;font-size:11px;">Studio · Oniru, Lagos · styleme@mykindofstyle.com</p>
  </div>
</body>
</html>`;
}
