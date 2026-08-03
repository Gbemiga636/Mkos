/** Canonical MKoS brand copy — keep site surfaces aligned with this. */

/** Always M·K·o·S — lowercase o. Never MKOS / Mkos. */
export const BRAND_NAME = "MKoS";

const BRAND_RE = /\bmkos\b/gi;

/** Force every brand occurrence to exact casing `MKoS`. */
export function normalizeBrandText(value: string): string {
  return value.replace(BRAND_RE, BRAND_NAME);
}

/**
 * Uppercase a label for display while keeping `MKoS` intact
 * (CSS `text-transform: uppercase` would turn it into MKOS).
 */
export function upperPreserveBrand(value: string): string {
  return value
    .split(BRAND_RE)
    .map((part) => (/^mkos$/i.test(part) ? BRAND_NAME : part.toUpperCase()))
    .join("");
}

export const BRAND_PROMISE = "For Those Who Understand STYLE.";

export const BRAND_MISSION =
  "To create timeless luxury fashion that celebrates individuality through exceptional craftsmanship, contemporary design, and African heritage—delivering bespoke experiences that inspire confidence, elegance, and enduring style.";

export const BRAND_VISION =
  "To become Africa’s most admired luxury fashion house, recognised globally for redefining modern African luxury through innovation, authenticity, craftsmanship, sustainability, and exceptional customer experiences.";

export const BRAND_PHILOSOPHY_TITLE = "Timeless by Design.";

export const BRAND_PHILOSOPHY_BODY =
  "We believe true luxury is created with intention. Every MKoS piece is thoughtfully designed, expertly crafted, and made to transcend trends—celebrating individuality, African heritage, and timeless elegance.";

export const BRAND_EXPERIENCE =
  "Luxury is more than what you wear—it’s how you feel. Whether you’re discovering our Ready-to-Wear collections, commissioning a bespoke creation, or celebrating life’s most special moments with our bridal designs, every MKoS experience is thoughtfully curated with exceptional craftsmanship, personalised service, and timeless elegance.";

export const MASTER_INTRO =
  "At MKoS, our name is more than a brand—it is our philosophy. MKoS defines who we are. MASTER defines how we work. Together, they form the MKoS MASTER Standard—the principles that guide every decision, every design, every relationship, and every client experience.";

export const FEATURED_FILM_SUBTITLE =
  "Every stitch tells a story. Step behind the scenes and experience the craftsmanship, creativity, and passion that bring every MKoS piece to life.";

export const MKoS_PILLARS = [
  {
    letter: "M",
    title: "Mastery",
    text: "We pursue excellence in craftsmanship, service, and every client experience.",
  },
  {
    letter: "K",
    title: "Know Your Authenticity",
    text: "We honour African heritage while celebrating individuality, culture, identity, and the confidence to express your own style.",
  },
  {
    letter: "O",
    title: "Own It",
    text: "We lead with integrity, accountability, and professionalism, taking ownership of every promise we make and every experience we deliver.",
  },
  {
    letter: "S",
    title: "Shape the Future",
    text: "We embrace innovation, sustainability, versatility, and continuous improvement to create timeless fashion with lasting impact.",
  },
] as const;

export const MASTER_PILLARS = [
  {
    letter: "M",
    title: "Mastery",
    text: "We pursue excellence in everything we create and every experience we deliver.",
  },
  {
    letter: "A",
    title: "Authenticity",
    text: "We remain true to our heritage, our craftsmanship, and our commitment to creating meaningful luxury.",
  },
  {
    letter: "S",
    title: "Sustainability",
    text: "We believe true sustainability begins with intentional design. We create versatile, timeless pieces that can be styled in multiple ways, worn across occasions, and cherished for years—encouraging conscious fashion over fast fashion while respecting our people, our craft, and our environment.",
  },
  {
    letter: "T",
    title: "Timeless Elegance",
    text: "We create refined designs that transcend trends and inspire confidence.",
  },
  {
    letter: "E",
    title: "Empowerment",
    text: "We foster a culture of respect, collaboration, ownership, and continuous learning, empowering our people, artisans, partners, and clients to thrive.",
  },
  {
    letter: "R",
    title: "Responsibility",
    text: "We lead with integrity, professionalism, accountability, and a commitment to delivering on every promise.",
  },
] as const;

export const BRAND_STORY_BODY = [
  "MKoS (My Kind of Style) is a Nigerian contemporary fashion brand dedicated to creating timeless luxury fashion for individuals who appreciate exceptional craftsmanship, refined style, and cultural authenticity.",
  "More than a fashion label, MKoS is a lifestyle brand that seamlessly blends contemporary design with African heritage — elegant, sophisticated, and distinctive.",
  "The MKoS MASTER Standard defines our core values: MKoS defines who we are; MASTER defines how we work.",
].join("\n\n");

/** Homepage / CMS teaser values = MKoS pillars */
export const BRAND_TEASER_VALUES = MKoS_PILLARS.map((p) => ({
  title: `${p.letter} — ${p.title}`,
  text: p.text,
}));
