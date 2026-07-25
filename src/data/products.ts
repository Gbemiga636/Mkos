export type ProductColor = {
  name: string;
  hex: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  story: string;
  price: number;
  compareAt?: number;
  images: string[];
  category: string;
  collection: string;
  colors: ProductColor[];
  sizes: string[];
  material: string;
  rating: number;
  reviews: number;
  stock: number;
  tags: string[];
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  trending?: boolean;
};

export const categories = [
  { slug: "essentials", name: "Essentials", description: "Foundational pieces refined to perfection." },
  { slug: "atelier", name: "Atelier", description: "Limited cuts from the private studio." },
  { slug: "outerwear", name: "Outerwear", description: "Architectural layers for the modern silhouette." },
  { slug: "knitwear", name: "Knitwear", description: "Soft structure. Quiet luxury." },
] as const;

export const collections = [
  {
    slug: "noir-edit",
    name: "The Noir Edit",
    description: "A study in shadow, proportion, and restraint.",
    image: "/images/products/product-1.jpg",
    video: "/videos/cloth-1.mp4",
  },
  {
    slug: "white-space",
    name: "White Space",
    description: "Light as architecture. Form as language.",
    image: "/images/products/product-4.jpg",
    video: "/videos/white-space.mp4",
  },
  {
    slug: "atelier-25",
    name: "Atelier '25",
    description: "Hand-finished details for those who notice.",
    image: "/images/products/wa-1.jpg",
  },
] as const;

export const products: Product[] = [
  {
    id: "mk-001",
    slug: "sculpted-wool-coat",
    name: "Sculpted Wool Coat",
    tagline: "Architecture you can wear",
    description:
      "A precision-cut wool coat with a quiet shoulder line and elongated silhouette. Soft hand-feel, sharp intention.",
    story:
      "Cut from Italian wool and shaped on a private form, this coat was designed to hold silence — clean lines that move with you, not against you.",
    price: 890000,
    compareAt: 980000,
    images: ["/images/products/product-1.jpg", "/images/products/product-2.jpg", "/images/products/product-3.jpg"],
    category: "outerwear",
    collection: "noir-edit",
    colors: [
      { name: "Obsidian", hex: "#111111" },
      { name: "Stone", hex: "#8a8680" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "100% Italian wool",
    rating: 4.9,
    reviews: 128,
    stock: 14,
    tags: ["coat", "wool", "winter"],
    featured: true,
    bestSeller: true,
  },
  {
    id: "mk-002",
    slug: "liquid-silk-blouse",
    name: "Liquid Silk Blouse",
    tagline: "Motion without noise",
    description:
      "A fluid silk blouse that catches light like water. Minimal placket, precise cuff, effortless drape.",
    story:
      "Woven from mulberry silk and finished with invisible seams, this piece was made for rooms where details are the conversation.",
    price: 420000,
    images: ["/images/products/wa-2.jpg", "/images/products/product-3.jpg", "/images/products/product-4.jpg"],
    category: "essentials",
    collection: "white-space",
    colors: [
      { name: "Ivory", hex: "#f5f2eb" },
      { name: "Noir", hex: "#1a1a1a" },
      { name: "Blush", hex: "#e8d5d0" },
    ],
    sizes: ["XS", "S", "M", "L"],
    material: "100% Mulberry silk",
    rating: 4.8,
    reviews: 96,
    stock: 22,
    tags: ["silk", "blouse"],
    featured: true,
    newArrival: true,
    trending: true,
  },
  {
    id: "mk-003",
    slug: "cascade-cashmere-knit",
    name: "Cascade Cashmere Knit",
    tagline: "Soft power",
    description:
      "Weightless cashmere with a deliberate cascade neckline. Warmth without bulk. Presence without force.",
    story:
      "Spun in Scotland and finished by hand, Cascade is the knit you reach for when the day asks for quiet confidence.",
    price: 560000,
    images: ["/images/products/product-3.jpg", "/images/products/product-5.jpg", "/images/products/product-6.jpg"],
    category: "knitwear",
    collection: "atelier-25",
    colors: [
      { name: "Fog", hex: "#c5c0b8" },
      { name: "Ink", hex: "#222222" },
      { name: "Heather", hex: "#7a6f66" },
    ],
    sizes: ["S", "M", "L", "XL"],
    material: "100% Cashmere",
    rating: 5.0,
    reviews: 74,
    stock: 9,
    tags: ["cashmere", "knit"],
    featured: true,
    bestSeller: true,
  },
  {
    id: "mk-004",
    slug: "column-trouser",
    name: "Column Trouser",
    tagline: "Vertical clarity",
    description:
      "A high-rise trouser with a continuous column line. Pressed crease, floating hem, absolute proportion.",
    story:
      "Inspired by gallery architecture, Column elongates the silhouette with a single uninterrupted line from waist to floor.",
    price: 380000,
    images: ["/images/products/wa-3.jpg", "/images/products/product-6.jpg", "/images/products/product-8.jpg"],
    category: "essentials",
    collection: "white-space",
    colors: [
      { name: "Black", hex: "#0d0d0d" },
      { name: "Sand", hex: "#d4cfc6" },
      { name: "Navy", hex: "#1e2a3a" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Italian wool blend",
    rating: 4.7,
    reviews: 112,
    stock: 31,
    tags: ["trouser", "tailoring"],
    newArrival: true,
    trending: true,
  },
  {
    id: "mk-005",
    slug: "atelier-leather-tote",
    name: "Atelier Leather Tote",
    tagline: "Quiet capacity",
    description:
      "Vegetable-tanned leather shaped into a sculptural tote. Soft structure, hidden hardware, lifelong patina.",
    story:
      "Each tote is cut from a single hide and hand-burnished. It begins pristine and becomes unmistakably yours.",
    price: 720000,
    images: ["/images/products/product-5.jpg", "/images/products/product-7.jpg", "/images/products/product-9.jpg"],
    category: "atelier",
    collection: "atelier-25",
    colors: [
      { name: "Cognac", hex: "#8b5a2b" },
      { name: "Black", hex: "#111111" },
    ],
    sizes: ["One Size"],
    material: "Vegetable-tanned leather",
    rating: 4.9,
    reviews: 58,
    stock: 11,
    tags: ["bag", "leather"],
    featured: true,
    bestSeller: true,
  },
  {
    id: "mk-006",
    slug: "veil-midi-dress",
    name: "Veil Midi Dress",
    tagline: "Sheer intention",
    description:
      "A layered midi with a floating outer veil and precise inner slip. Movement becomes the statement.",
    story:
      "Designed for evening light, Veil shifts between opacity and translucence as you move — never loud, always noticed.",
    price: 640000,
    images: ["/images/products/wa-4.jpg", "/images/products/product-8.jpg", "/images/products/product-10.jpg"],
    category: "atelier",
    collection: "noir-edit",
    colors: [
      { name: "Midnight", hex: "#0a0a12" },
      { name: "Champagne", hex: "#e8dcc8" },
    ],
    sizes: ["XS", "S", "M", "L"],
    material: "Silk chiffon & cupro",
    rating: 4.8,
    reviews: 41,
    stock: 7,
    tags: ["dress", "evening"],
    newArrival: true,
    trending: true,
  },
  {
    id: "mk-007",
    slug: "horizon-blazer",
    name: "Horizon Blazer",
    tagline: "Soft structure",
    description:
      "An unlined blazer with a floating canvas and open shoulder. Tailoring that breathes.",
    story:
      "Horizon rejects stiff construction. The result is a jacket that drapes like knitwear and holds like architecture.",
    price: 690000,
    images: ["/images/products/wa-1.jpg", "/images/products/product-1.jpg", "/images/products/product-9.jpg"],
    category: "outerwear",
    collection: "atelier-25",
    colors: [
      { name: "Charcoal", hex: "#3a3a3a" },
      { name: "Ecru", hex: "#ebe6dc" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Wool-silk blend",
    rating: 4.9,
    reviews: 87,
    stock: 16,
    tags: ["blazer", "tailoring"],
    featured: true,
    bestSeller: true,
  },
  {
    id: "mk-008",
    slug: "pulse-rib-tank",
    name: "Pulse Rib Tank",
    tagline: "Second skin",
    description:
      "Fine-gauge rib tank engineered for layering or solitude. Contoured seams, invisible finish.",
    story:
      "The foundation of every MKOS edit — a tank so precise it disappears until you notice how everything else sits better.",
    price: 145000,
    images: ["/images/products/wa-5.jpg", "/images/products/product-2.jpg", "/images/products/product-11.jpg"],
    category: "essentials",
    collection: "white-space",
    colors: [
      { name: "White", hex: "#ffffff" },
      { name: "Black", hex: "#111111" },
      { name: "Bone", hex: "#f0ebe3" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Organic cotton rib",
    rating: 4.6,
    reviews: 203,
    stock: 48,
    tags: ["tank", "basics"],
    trending: true,
    newArrival: true,
  },
  {
    id: "mk-009",
    slug: "eclipse-evening-skirt",
    name: "Eclipse Evening Skirt",
    tagline: "Gravity, rewritten",
    description:
      "A bias-cut evening skirt with a continuous hem that catches every turn. Matte silk, liquid motion.",
    story:
      "Named for the way it swallows light and returns it as movement — Eclipse is eveningwear reduced to essence.",
    price: 510000,
    images: ["/images/products/product-9.jpg", "/images/products/product-6.jpg", "/images/products/product-4.jpg"],
    category: "atelier",
    collection: "noir-edit",
    colors: [
      { name: "Black", hex: "#0a0a0a" },
      { name: "Wine", hex: "#4a1c2a" },
    ],
    sizes: ["XS", "S", "M", "L"],
    material: "Matte silk satin",
    rating: 4.8,
    reviews: 33,
    stock: 8,
    tags: ["skirt", "evening"],
    featured: true,
    trending: true,
  },
  {
    id: "mk-010",
    slug: "meridian-shirt",
    name: "Meridian Shirt",
    tagline: "The perfect white",
    description:
      "An obsessive white shirt. Mother-of-pearl buttons, French seams, a collar that holds its own.",
    story:
      "Three years of prototypes led to this: a shirt that looks effortless because every millimetre was argued over.",
    price: 295000,
    images: ["/images/products/product-10.jpg", "/images/products/product-8.jpg", "/images/products/product-2.jpg"],
    category: "essentials",
    collection: "white-space",
    colors: [
      { name: "Optical White", hex: "#fafafa" },
      { name: "Sky", hex: "#d8e4ec" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Egyptian cotton poplin",
    rating: 4.9,
    reviews: 167,
    stock: 27,
    tags: ["shirt", "white"],
    bestSeller: true,
    newArrival: true,
  },
  {
    id: "mk-011",
    slug: "drift-oversized-shirt",
    name: "Drift Oversized Shirt",
    tagline: "Volume, controlled",
    description:
      "An oversized shirt with deliberate drop shoulders and a curved hem. Soft cotton with a washed finish.",
    story:
      "Drift is the shirt you throw on and somehow look composed — volume calibrated so it never overwhelms.",
    price: 265000,
    images: ["/images/products/product-11.jpg", "/images/products/product-10.jpg", "/images/products/product-1.jpg"],
    category: "essentials",
    collection: "atelier-25",
    colors: [
      { name: "Washed Black", hex: "#2a2a2a" },
      { name: "Clay", hex: "#b8a99a" },
      { name: "White", hex: "#f7f7f5" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Washed cotton twill",
    rating: 4.7,
    reviews: 91,
    stock: 19,
    tags: ["shirt", "oversized"],
    newArrival: true,
    trending: true,
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4) {
  return products
    .filter((p) => p.id !== product.id && (p.collection === product.collection || p.category === product.category))
    .slice(0, limit);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}

export const reviews = [
  {
    id: 1,
    name: "Amelia R.",
    location: "Paris",
    rating: 5,
    text: "The coat arrived like a gift from another world. Packaging, finish, fit — everything whispered quality.",
    product: "Sculpted Wool Coat",
  },
  {
    id: 2,
    name: "Jordan K.",
    location: "New York",
    rating: 5,
    text: "I have never felt fabric this considered. MKOS doesn't shout. It simply arrives.",
    product: "Cascade Cashmere Knit",
  },
  {
    id: 3,
    name: "Sofia L.",
    location: "Milan",
    rating: 5,
    text: "The website alone made me trust them. The pieces confirmed it. Quiet luxury, finally done right.",
    product: "Horizon Blazer",
  },
  {
    id: 4,
    name: "Marcus T.",
    location: "London",
    rating: 5,
    text: "Bought the tote as a gift. Kept it. That should tell you everything.",
    product: "Atelier Leather Tote",
  },
];

export const faqs = [
  {
    q: "How long does shipping take?",
    a: "Complimentary express shipping arrives in 2–4 business days within the US and EU. International delivery is typically 4–7 business days.",
  },
  {
    q: "What is your return policy?",
    a: "Unworn pieces may be returned within 30 days in original condition. Complimentary returns are provided with a prepaid label.",
  },
  {
    q: "How do I find my size?",
    a: "Each product includes a precise size guide. For tailored pieces, we recommend our fit specialist chat — available during atelier hours.",
  },
  {
    q: "Are materials ethically sourced?",
    a: "Yes. We partner only with certified mills and tanneries. Traceability details appear on every product page under Specifications.",
  },
  {
    q: "Do you offer alterations?",
    a: "Select cities include complimentary in-store alterations within 14 days of purchase. Book via your account dashboard.",
  },
];
