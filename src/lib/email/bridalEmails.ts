export type BridalBriefPayload = {
  primaryContactName: string;
  phone: string;
  email: string;
  preferredComm: string[];
  country: string;
  stateProvince: string;
  city: string;
  stylingFor: string[];
  stylingOther?: string;
  stylingExperience: string[];
  weddingDate?: string;
  stage?: string;
  weddingCountry?: string;
  weddingState?: string;
  weddingCity?: string;
  venue?: string;
  weddingCulture: string[];
  cultureOther?: string;
  additionalEvents: string[];
  eventsOther?: string;
  fabricProvider?: string;
  fabricCombinationNote?: string;
  preferredFabrics?: string;
  preferredColourPalette?: string;
  specialRequests?: string;
  partyBride?: string;
  partyGroom?: string;
  partyBridesmaids?: string;
  partyGroomsmen?: string;
  partyParents?: string;
  partyOther?: string;
  experienceType?: string;
  consultationStart?: string;
  fittingsOption?: string;
  timeline?: string;
  plannerName?: string;
  plannerCompany?: string;
  plannerPhone?: string;
  plannerEmail?: string;
  hearAbout: string[];
  hearOther?: string;
  additionalNotes?: string;
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

function shell(title: string, intro: string, rowsHtml: string, footerNote: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111;color:#fff;padding:28px 32px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.28em;opacity:0.65;">MKoS · Bridal</p>
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

export function adminBridalEmailHtml(p: BridalBriefPayload) {
  const rows = [
    row("Primary contact", p.primaryContactName),
    row("Phone", p.phone),
    row("Email", p.email),
    row("Preferred communication", p.preferredComm.join(", ") || undefined),
    row("Location", [p.city, p.stateProvince, p.country].filter(Boolean).join(", ") || undefined),
    row("Who we’re styling", [...p.stylingFor, p.stylingOther ? `Other: ${p.stylingOther}` : ""].filter(Boolean).join(", ") || undefined),
    row("Styling experience", p.stylingExperience.join(", ") || undefined),
    row("Wedding date", p.weddingDate),
    row("Stage", p.stage),
    row(
      "Wedding location",
      [p.weddingCity, p.weddingState, p.weddingCountry, p.venue ? `Venue: ${p.venue}` : ""]
        .filter(Boolean)
        .join(", ") || undefined
    ),
    row("Wedding culture", [...p.weddingCulture, p.cultureOther ? `Other: ${p.cultureOther}` : ""].filter(Boolean).join(", ") || undefined),
    row("Additional events", [...p.additionalEvents, p.eventsOther ? `Other: ${p.eventsOther}` : ""].filter(Boolean).join(", ") || undefined),
    row("Fabric provider", p.fabricProvider),
    row("Fabric combination note", p.fabricCombinationNote),
    row("Preferred fabrics", p.preferredFabrics),
    row("Colour palette", p.preferredColourPalette),
    row("Special requests", p.specialRequests),
    row(
      "Bridal party counts",
      [
        p.partyBride && `Bride: ${p.partyBride}`,
        p.partyGroom && `Groom: ${p.partyGroom}`,
        p.partyBridesmaids && `Bridesmaids: ${p.partyBridesmaids}`,
        p.partyGroomsmen && `Groomsmen: ${p.partyGroomsmen}`,
        p.partyParents && `Parents: ${p.partyParents}`,
        p.partyOther && `Other: ${p.partyOther}`,
      ]
        .filter(Boolean)
        .join(" · ") || undefined
    ),
    row("MKoS Experience", p.experienceType),
    row("Consultation", p.consultationStart),
    row("Fittings", p.fittingsOption),
    row("Timeline", p.timeline),
    row("Planner", [p.plannerName, p.plannerCompany].filter(Boolean).join(" · ") || undefined),
    row("Planner phone", p.plannerPhone),
    row("Planner email", p.plannerEmail),
    row("How they heard", [...p.hearAbout, p.hearOther ? `Other: ${p.hearOther}` : ""].filter(Boolean).join(", ") || undefined),
    row("Additional notes", p.additionalNotes),
  ].join("");

  return shell(
    `Bridal brief · ${p.primaryContactName}`,
    "A client submitted a Client Bridal Brief. Reply to this email to reach them.",
    rows,
    "Review carefully, then schedule their bridal consultation."
  );
}

export function clientBridalEmailHtml(p: BridalBriefPayload) {
  const rows = [
    row("Name", p.primaryContactName),
    row("Request", "Client Bridal Brief"),
    row("Wedding date", p.weddingDate),
  ].join("");

  return shell(
    "Your Bridal brief is with the house",
    "Thank you for choosing MKoS. Your bridal brief will be personally reviewed by our atelier. We’ll reach out to you to schedule your consultation and begin creating a look that celebrates your story.",
    rows,
    "Showroom · Oniru, Victoria Island, Lagos · @shopmykindofstyle · styleme@mykindofstyle.com"
  );
}
