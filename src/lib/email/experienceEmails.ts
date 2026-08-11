import { normalizeBrandText, upperPreserveBrand } from "@/lib/brand";

export type ExperienceInquiryKind = "content" | "full_glam";

export type ExperienceInquiryPayload = {
  kind: ExperienceInquiryKind;
  fullName: string;
  email: string;
  phone?: string;
  /** Content / filming consent */
  filmed?: string;
  posted?: string;
  contentNotes?: string;
  visitWindow?: string;
  /** Full Glam */
  eventType?: string;
  eventDate?: string;
  services?: string[];
  consultation?: string;
  glamNotes?: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value?: string | null) {
  if (!value) return "";
  const displayLabel = upperPreserveBrand(normalizeBrandText(label));
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b6b6b;font-size:12px;letter-spacing:0.12em;width:38%;vertical-align:top;">${escapeHtml(displayLabel)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;font-size:15px;">${escapeHtml(value)}</td>
  </tr>`;
}

function shell(title: string, intro: string, rowsHtml: string, footerNote: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fafafa;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111;color:#fff;padding:28px 32px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.28em;opacity:0.65;">MKoS Experience</p>
      <h1 style="margin:12px 0 0;font-size:26px;font-weight:500;letter-spacing:-0.02em;">${escapeHtml(title)}</h1>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid rgba(17,17,17,0.08);">
      <p style="margin:0 0 24px;color:#6b6b6b;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
      <p style="margin:28px 0 0;color:#6b6b6b;font-size:13px;line-height:1.5;">${escapeHtml(footerNote)}</p>
    </div>
    <p style="margin:20px 0 0;text-align:center;color:#999;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">For Those Who Understand STYLE</p>
  </div>
</body>
</html>`;
}

export function adminExperienceEmailHtml(p: ExperienceInquiryPayload) {
  const isGlam = p.kind === "full_glam";
  const title = isGlam ? "Full Glam consultation request" : "Studio content interest";
  const intro = isGlam
    ? "A client wants to book a consultation for the Full Glam Experience."
    : "A client shared their comfort preferences for MKoS Experience studio content.";

  const rows = isGlam
    ? [
        row("Name", p.fullName),
        row("Email", p.email),
        row("Phone", p.phone),
        row("Event type", p.eventType),
        row("Event date", p.eventDate),
        row("Services", (p.services || []).join(", ") || undefined),
        row("Consultation", p.consultation),
        row("Notes", p.glamNotes),
      ].join("")
    : [
        row("Name", p.fullName),
        row("Email", p.email),
        row("Phone", p.phone),
        row("Comfortable being filmed", p.filmed),
        row("Comfortable being posted", p.posted),
        row("Preferred visit window", p.visitWindow),
        row("Notes", p.contentNotes),
      ].join("");

  return shell(title, intro, rows, "Reply directly to this email to reach the client.");
}

export function clientExperienceEmailHtml(p: ExperienceInquiryPayload) {
  const isGlam = p.kind === "full_glam";
  const title = isGlam ? "We received your Full Glam request" : "Thank you for sharing your preference";
  const intro = isGlam
    ? "The MKoS studio has your Full Glam consultation request. We’ll reach out to schedule your appointment and walk through hair, makeup, gele, and outfit together."
    : "Thank you for telling us how you’d like to be included in MKoS Experience. When you visit the studio, we’ll honour your preferences — so the vibe stays right for you.";

  const rows = [
    row("Name", p.fullName),
    row("Request", isGlam ? "Full Glam Experience" : "MKoS Experience content"),
  ].join("");

  return shell(
    title,
    intro,
    rows,
    "Studio · Oniru, Lagos · WhatsApp 08143173661 · styleme@mykindofstyle.com"
  );
}
