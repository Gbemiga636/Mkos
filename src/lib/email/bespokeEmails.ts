import type { StyleBriefPayload } from "@/lib/email/styleBriefEmails";

export type BespokeInquiryPayload = StyleBriefPayload & {
  services: string[];
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
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b6b6b;font-size:11px;letter-spacing:0.12em;width:34%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;font-size:15px;white-space:pre-wrap;">${escapeHtml(value)}</td>
  </tr>`;
}

function list(items: string[], other?: string) {
  const all = [...items];
  if (other) all.push(`Other: ${other}`);
  return all.length ? all.join(", ") : undefined;
}

function shell(title: string, intro: string, rowsHtml: string, footerNote: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111;color:#fff;padding:28px 32px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.28em;opacity:0.65;">MKoS · Bespoke / Custom Wear</p>
      <h1 style="margin:12px 0 0;font-size:26px;font-weight:500;letter-spacing:-0.02em;">${escapeHtml(title)}</h1>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid rgba(17,17,17,0.08);">
      <p style="margin:0 0 24px;color:#6b6b6b;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
      <p style="margin:28px 0 0;color:#6b6b6b;font-size:13px;line-height:1.5;">${escapeHtml(footerNote)}</p>
    </div>
    <p style="margin:20px 0 0;text-align:center;color:#999;font-size:11px;letter-spacing:0.2em;">MKoS — My Kind of Style</p>
  </div>
</body>
</html>`;
}

export function adminBespokeEmailHtml(p: BespokeInquiryPayload) {
  const rows = [
    row("Full name", p.fullName),
    row("Phone", p.phone),
    row("Email", p.email),
    row("Instagram", p.instagram),
    row("Event type", list(p.eventTypes, p.eventOther)),
    row("Event date", p.eventDate),
    row("Outfit needed by", p.outfitNeededBy),
    row("Outfit", list(p.outfitTypes, p.outfitOther)),
    row("Preferred style / inspiration", p.preferredStyle),
    row("Inspiration note", p.inspirationNote),
    row("Preferred fabric", p.preferredFabric),
    row("Preferred color(s)", p.preferredColors),
    row("Colors to avoid", p.avoidColors),
    row("Measurements", p.measurementsOption),
    row("Past order / measurement notes", p.pastOrderNotes),
    row("Budget", p.budget),
    row("Atelier services", (p.services || []).join(", ") || undefined),
    row("Consultation", p.consultation),
    row("Glam / styling notes", p.glamNotes),
    row("Additional requests", p.additionalRequests),
    row("MKoS Experience content", p.contentPermission),
    row("Delivery method", p.deliveryMethod),
    row("Delivery address", p.deliveryAddress),
  ].join("");

  return shell(
    `Bespoke request · ${p.fullName}`,
    "A client started a Bespoke / Custom Wear atelier brief. Reply to this email to reach them.",
    rows,
    "Inspiration photos (if attached) are included with this message."
  );
}

export function clientBespokeEmailHtml(p: BespokeInquiryPayload) {
  const rows = [
    row("Name", p.fullName),
    row("Request", "Bespoke / Custom Wear"),
    row("Services", (p.services || []).join(", ") || undefined),
  ].join("");

  return shell(
    "Your Bespoke brief is with the house",
    "Thank you for trusting MKoS with your custom piece. The studio has your brief and will be in touch to refine fittings, fabrics, and timing.",
    rows,
    "Studio · Oniru, Lagos · WhatsApp 08143173661 · mkosfashionhouse@gmail.com"
  );
}
