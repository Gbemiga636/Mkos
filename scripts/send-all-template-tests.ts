/**
 * Send sample HTML from every atelier/order email template to test inboxes.
 * Usage: npx tsx scripts/send-all-template-tests.ts
 */
import fs from "fs";
import path from "path";
import { Resend } from "resend";
import {
  adminOrderEmailHtml,
  customerOrderEmailHtml,
  type OrderEmailPayload,
} from "../src/lib/email/orderEmails";
import {
  adminExperienceEmailHtml,
  clientExperienceEmailHtml,
  type ExperienceInquiryPayload,
} from "../src/lib/email/experienceEmails";
import {
  adminStyleBriefEmailHtml,
  clientStyleBriefEmailHtml,
  type StyleBriefPayload,
} from "../src/lib/email/styleBriefEmails";
import {
  adminBespokeEmailHtml,
  clientBespokeEmailHtml,
  type BespokeInquiryPayload,
} from "../src/lib/email/bespokeEmails";
import {
  adminBridalEmailHtml,
  clientBridalEmailHtml,
  type BridalBriefPayload,
} from "../src/lib/email/bridalEmails";

function loadEnv(file: string) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env.local");
loadEnv(".env");

const key = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL || "MKoS <hello@mykindofstyle.com>";
const recipients = ["styleme@mykindofstyle.com", "gboisholaja@gmail.com"];

if (!key) {
  console.error("RESEND_API_KEY missing in .env.local");
  process.exit(1);
}

const sampleOrder: OrderEmailPayload = {
  orderId: "test-order",
  reference: "mkos_test_ref",
  email: "client.test@example.com",
  customerName: "Test Client",
  phone: "+2348000000000",
  addressLine: "1 Ade Adedeji Close",
  city: "Lagos",
  state: "Lagos",
  postal: "",
  country: "Nigeria",
  items: [
    {
      name: "Sample Set",
      quantity: 1,
      price: 240,
      color: "Black",
      size: "M",
      sizingMode: "size",
      image: null,
    },
  ],
  subtotal: 240,
  shipping: 0,
  total: 240,
  currency: "USD",
  deliveryMethod: "pickup",
  expectedDeliveryDate: "2026-09-01",
};

const sampleStyle: StyleBriefPayload = {
  fullName: "Test Client",
  phone: "+2348000000000",
  email: "client.test@example.com",
  instagram: "@test",
  eventTypes: ["Wedding"],
  eventOther: "",
  eventDate: "2026-10-10",
  outfitNeededBy: "2026-09-20",
  outfitTypes: ["Dress"],
  outfitOther: "",
  preferredStyle: "Soft structure",
  inspirationNote: "TEST — ignore.",
  preferredFabric: "Broderie",
  preferredColors: "Ivory",
  avoidColors: "",
  measurementsOption: "showroom",
  pastOrderNotes: "",
  budget: "$350–$500",
  additionalRequests: "",
  contentPermission: "yes",
  deliveryMethod: "pickup",
  deliveryAddress: "",
};

const sampleBespoke: BespokeInquiryPayload = {
  ...sampleStyle,
  services: ["Makeup", "Gele"],
  consultation: "in-studio",
  glamNotes: "TEST — ignore.",
};

const sampleBridal: BridalBriefPayload = {
  primaryContactName: "Test Bride",
  phone: "+2348000000000",
  email: "client.test@example.com",
  preferredComm: ["Email", "WhatsApp"],
  country: "Nigeria",
  stateProvince: "Lagos",
  city: "Lagos",
  stylingFor: ["Bride"],
  stylingExperience: ["First time"],
  weddingDate: "2026-12-12",
  weddingCountry: "Nigeria",
  weddingCity: "Lagos",
  weddingCulture: ["Yoruba"],
  additionalEvents: [],
  hearAbout: ["Instagram"],
  additionalNotes: "TEST — ignore.",
};

const sampleExperience: ExperienceInquiryPayload = {
  kind: "full_glam",
  fullName: "Test Client",
  email: "client.test@example.com",
  phone: "+2348000000000",
  eventType: "Birthday",
  eventDate: "2026-08-20",
  services: ["Makeup", "Gele"],
  consultation: "virtual",
  glamNotes: "TEST — ignore.",
};

const jobs: { subject: string; html: string }[] = [
  { subject: "[TEST] Order · admin alert", html: adminOrderEmailHtml(sampleOrder) },
  {
    subject: "[TEST] Order · client confirmation",
    html: customerOrderEmailHtml(sampleOrder),
  },
  {
    subject: "[TEST] Experience · admin alert",
    html: adminExperienceEmailHtml(sampleExperience),
  },
  {
    subject: "[TEST] Experience · client confirmation",
    html: clientExperienceEmailHtml(sampleExperience),
  },
  {
    subject: "[TEST] Style Brief · admin alert",
    html: adminStyleBriefEmailHtml(sampleStyle),
  },
  {
    subject: "[TEST] Style Brief · client confirmation",
    html: clientStyleBriefEmailHtml(sampleStyle),
  },
  {
    subject: "[TEST] Bespoke · admin alert",
    html: adminBespokeEmailHtml(sampleBespoke),
  },
  {
    subject: "[TEST] Bespoke · client confirmation",
    html: clientBespokeEmailHtml(sampleBespoke),
  },
  {
    subject: "[TEST] Bridal · admin alert",
    html: adminBridalEmailHtml(sampleBridal),
  },
  {
    subject: "[TEST] Bridal · client confirmation",
    html: clientBridalEmailHtml(sampleBridal),
  },
];

const resend = new Resend(key);

async function main() {
  for (const job of jobs) {
    for (const to of recipients) {
      const r = await resend.emails.send({ from, to, subject: job.subject, html: job.html });
      if (r.error) {
        console.error("FAIL", job.subject, "→", to, r.error);
      } else {
        console.log("OK", job.subject, "→", to, r.data?.id);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
