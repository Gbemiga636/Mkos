import { normalizeBrandText, upperPreserveBrand } from "@/lib/brand";

export type StyleBriefPayload = {
  fullName: string;
  phone: string;
  email: string;
  instagram?: string;
  eventTypes: string[];
  eventOther?: string;
  eventDate?: string;
  outfitNeededBy?: string;
  outfitTypes: string[];
  outfitOther?: string;
  preferredStyle?: string;
  preferredFabric?: string;
  preferredColors?: string;
  avoidColors?: string;
  measurementsOption?: string;
  pastOrderNotes?: string;
  budget?: string;
  additionalRequests?: string;
  contentPermission?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  inspirationNote?: string;
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
  // Prefer manual casing so MKoS keeps its lowercase o (CSS uppercase → MKOS).
  const displayLabel = upperPreserveBrand(normalizeBrandText(label));
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #eee;color:#6b6b6b;font-size:11px;letter-spacing:0.12em;width:34%;vertical-align:top;">${escapeHtml(displayLabel)}</td>
    <td style="padding:10px 0;border-bottom:1px solid #eee;color:#111;font-size:15px;white-space:pre-wrap;">${escapeHtml(value)}</td>
  </tr>`;
}

function shell(title: string, intro: string, rowsHtml: string, footerNote: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fafafa;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111;color:#fff;padding:28px 32px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.28em;opacity:0.65;">MKoS · Client Style Brief</p>
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

function list(items: string[], other?: string) {
  const all = [...items];
  if (other) all.push(`Other: ${other}`);
  return all.length ? all.join(", ") : undefined;
}

export function adminStyleBriefEmailHtml(p: StyleBriefPayload) {
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
    row("Additional requests", p.additionalRequests),
    row("MKoS Experience content", p.contentPermission),
    row("Delivery method", p.deliveryMethod),
    row("Delivery address", p.deliveryAddress),
  ].join("");

  return shell(
    `Style brief · ${p.fullName}`,
    "A client submitted the Client Style Brief. Reply to this email to reach them.",
    rows,
    "Inspiration photos (if attached) are included with this message."
  );
}

export function clientStyleBriefEmailHtml(p: StyleBriefPayload) {
  const rows = [
    row("Name", p.fullName),
    row("Event", list(p.eventTypes, p.eventOther) || "—"),
    row("Outfit", list(p.outfitTypes, p.outfitOther) || "—"),
  ].join("");

  return shell(
    "We received your style brief",
    "Thank you for choosing MKoS. We’ve received your Client Style Brief and will be in touch as we begin creating a piece that reflects you beautifully.",
    rows,
    "Showroom · Oniru, Victoria Island, Lagos · @shopmykindofstyle · mkosfashionhouse@gmail.com"
  );
}
