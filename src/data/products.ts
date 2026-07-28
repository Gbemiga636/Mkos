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
  {
    slug: "women-rtw",
    name: "Women’s RTW",
    description: "Ready-to-wear for women — everyday elegance and occasion silhouettes.",
  },
  {
    slug: "men-rtw",
    name: "Men’s RTW",
    description: "Contemporary menswear blending modern utility with African heritage.",
  },
  {
    slug: "boubou",
    name: "Boubou",
    description: "Effortless boubou silhouettes — refined, comfortable, and ready to style.",
  },
] as const;

/** Categories shown under Ready-to-Wear on the shop */
export const RTW_CATEGORY_SLUGS = ["women-rtw", "men-rtw", "boubou"] as const;

export const collections = [
  {
    slug: "ready-to-wear",
    name: "Ready-to-Wear",
    description: "Timeless Ready-to-Wear for women and men — refined, versatile, ready now.",
    image: "/images/products/abeni-boubou.jpg",
  },
  {
    slug: "bespoke",
    name: "Bespoke",
    description:
      "Expertly crafted Custom/Bespoke — women’s and men’s bespoke, Aso Ebi, and occasion wear.",
    image: "/images/products/jagu-jacket.jpg",
  },
  {
    slug: "bridal",
    name: "Bridal",
    description:
      "Luxurious Bridal designs — registry gowns, reception dresses, bridesmaids, grooms, and family.",
    image: "/images/products/tammy-dress.jpg",
  },
] as const;

export const products: Product[] = [
  {
    id: "mk-001",
    slug: "abeni-boubou",
    name: "Abeni Boubou",
    tagline: "Easy to style. Premium comfort.",
    description:
      "A refined boubou designed for effortless elegance — premium fabric, comfortable to wear, and easy to style from day to evening.",
    story:
      "The Abeni Boubou is made for women who want presence without fuss. Soft structure, generous movement, and a silhouette that feels intentional every time you put it on.",
    price: 0,
    images: ["/images/products/abeni-boubou.jpg"],
    category: "boubou",
    collection: "ready-to-wear",
    colors: [
      { name: "Ink", hex: "#111111" },
      { name: "Ivory", hex: "#f5f2eb" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Premium woven fabric",
    rating: 5,
    reviews: 12,
    stock: 8,
    tags: ["boubou", "women", "occasion"],
    featured: true,
    bestSeller: true,
    newArrival: true,
  },
  {
    id: "mk-002",
    slug: "rolly-set",
    name: "Rolly Set",
    tagline: "Denim meets Aso Oke.",
    description:
      "Made with the combination of denim and Aso Oke, the MKoS Rolly Barrel pants are designed for women who want comfort and unforgettable style.",
    story:
      "Statement silhouette, functional pockets, and travel-ready ease — the Rolly Set moves with you while honouring African craftsmanship in every panel.",
    price: 0,
    images: ["/images/products/rolly-set.jpg"],
    category: "women-rtw",
    collection: "ready-to-wear",
    colors: [
      { name: "Indigo", hex: "#2c3e50" },
      { name: "Aso Oke Gold", hex: "#c4a35a" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Denim and Aso Oke",
    rating: 5,
    reviews: 9,
    stock: 10,
    tags: ["set", "denim", "aso-oke", "women"],
    featured: true,
    trending: true,
    newArrival: true,
  },
  {
    id: "mk-003",
    slug: "puzzle-dress",
    name: "Puzzle Dress",
    tagline: "Bold geometry. Timeless chic.",
    description:
      "A statement dress featuring geometric, puzzle-like detailing that blends vibrant stripes for a bold and timeless look.",
    story:
      "Statement detailing, easy to style, comfortable and chic — the Puzzle Dress is made for women who want to be remembered without saying a word.",
    price: 0,
    images: ["/images/products/puzzle-dress.jpg"],
    category: "women-rtw",
    collection: "ready-to-wear",
    colors: [
      { name: "Stripe Multi", hex: "#1a1a1a" },
      { name: "Burnt Orange", hex: "#c45c26" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Premium structured fabric",
    rating: 4.9,
    reviews: 7,
    stock: 6,
    tags: ["dress", "statement", "women"],
    featured: true,
    trending: true,
  },
  {
    id: "mk-004",
    slug: "tammy-dress",
    name: "Tammy Dress",
    tagline: "Day to night elegance.",
    description:
      "A sleek dress crafted with bold striped strap detailing and statement buckle accents, blending modern structure with effortless elegance.",
    story:
      "Ideal for day-to-night styling — comfortable, versatile for casual and occasion wear, and finished with details that feel distinctly MKoS.",
    price: 0,
    images: ["/images/products/tammy-dress.jpg"],
    category: "women-rtw",
    collection: "ready-to-wear",
    colors: [
      { name: "Noir", hex: "#111111" },
      { name: "Stripe", hex: "#e8e4dc" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Premium stretch weave",
    rating: 4.9,
    reviews: 11,
    stock: 7,
    tags: ["dress", "occasion", "women"],
    bestSeller: true,
    newArrival: true,
  },
  {
    id: "mk-005",
    slug: "lily-short-set",
    name: "Lily Short Set",
    tagline: "Elevated everyday wear.",
    description:
      "A timeless two-piece set designed for comfort, versatility, and elevated everyday wear.",
    story:
      "Multiple styling options in one coordinated set — premium fabric with functional side pockets for women who move through the day with intention.",
    price: 0,
    images: ["/images/products/lily-short-set.jpg"],
    category: "women-rtw",
    collection: "ready-to-wear",
    colors: [
      { name: "Sand", hex: "#d4c4a8" },
      { name: "Black", hex: "#111111" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "Premium soft fabric",
    rating: 4.8,
    reviews: 8,
    stock: 12,
    tags: ["set", "shorts", "women"],
    trending: true,
    bestSeller: true,
  },
  {
    id: "mk-006",
    slug: "jagu-jacket",
    name: "Jagu Jacket",
    tagline: "Contemporary meets heritage.",
    description:
      "A modern fusion jacket crafted with denim and Aso Oke accents, offering a blend of contemporary style and African heritage.",
    story:
      "Perfect for casual and formal occasions — easy to wear, effortless to style, and unmistakably MKoS Men.",
    price: 0,
    images: ["/images/products/jagu-jacket.jpg"],
    category: "men-rtw",
    collection: "ready-to-wear",
    colors: [
      { name: "Denim", hex: "#3d4f5f" },
      { name: "Aso Oke", hex: "#b8956c" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    material: "Denim and Aso Oke",
    rating: 5,
    reviews: 6,
    stock: 9,
    tags: ["jacket", "men", "aso-oke"],
    featured: true,
    newArrival: true,
    trending: true,
  },
  {
    id: "mk-007",
    slug: "asake-pants",
    name: "Asake Pants",
    tagline: "Utility with heritage.",
    description:
      "Contemporary wide-leg cargo pants crafted from premium denim and Aso Oke paneling, blending modern utility with African heritage.",
    story:
      "Spacious cargo pockets, a relaxed fit for everyday comfort, and versatile styling for casual, cultural, and statement looks.",
    price: 0,
    images: ["/images/products/asake-pants.jpg"],
    category: "men-rtw",
    collection: "ready-to-wear",
    colors: [
      { name: "Denim Blue", hex: "#4a5d6e" },
      { name: "Aso Oke Panel", hex: "#c9a66b" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    material: "Premium denim and Aso Oke",
    rating: 4.9,
    reviews: 5,
    stock: 11,
    tags: ["pants", "cargo", "men"],
    bestSeller: true,
    trending: true,
  },
  {
    id: "mk-008",
    slug: "sheed-set",
    name: "Sheed Set",
    tagline: "Relaxed. Refined. Ready.",
    description:
      "Relaxed two-piece with wide-leg trousers crafted from premium patterned fabrics, offering a clean, contemporary, and refined finish.",
    story:
      "Ideal for elevated occasions — designed for comfort and effortless movement without losing presence.",
    price: 0,
    images: ["/images/products/sheed-set.jpg"],
    category: "men-rtw",
    collection: "ready-to-wear",
    colors: [
      { name: "Patterned Neutral", hex: "#8a7a66" },
      { name: "Deep Charcoal", hex: "#2a2a2a" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    material: "Premium patterned fabric",
    rating: 4.9,
    reviews: 4,
    stock: 8,
    tags: ["set", "men", "occasion"],
    featured: true,
    newArrival: true,
  },
  {
    id: "mk-009",
    slug: "vintage-set",
    name: "Vintage Set",
    tagline: "Heritage, reimagined.",
    description:
      "A refined two-piece set that channels heritage textiles into a clean contemporary silhouette for the modern man.",
    story:
      "Crafted for men who value cultural authenticity with everyday ease — distinctive, wearable, and distinctly MKoS.",
    price: 0,
    images: ["/images/products/vintage-set.jpg"],
    category: "men-rtw",
    collection: "ready-to-wear",
    colors: [
      { name: "Heritage Weave", hex: "#6b5a45" },
      { name: "Black", hex: "#111111" },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    material: "Heritage textile blend",
    rating: 4.8,
    reviews: 3,
    stock: 5,
    tags: ["set", "men", "heritage"],
    trending: true,
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4) {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.collection === product.collection || p.category === product.category)
    )
    .slice(0, limit);
}

export function formatPrice(price: number) {
  if (!price || price <= 0) return "Price on request";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}

export const reviews = [
  {
    id: 1,
    name: "Adaeze O.",
    location: "Lagos",
    rating: 5,
    text: "The Puzzle Dress was everything — bold, comfortable, and so distinctly MKoS. I felt like myself, elevated.",
    product: "Puzzle Dress",
  },
  {
    id: 2,
    name: "Tunde A.",
    location: "Abuja",
    rating: 5,
    text: "The Jagu Jacket blends denim and Aso Oke perfectly. I wear it to meetings and celebrations alike.",
    product: "Jagu Jacket",
  },
  {
    id: 3,
    name: "Chioma E.",
    location: "London",
    rating: 5,
    text: "MKoS understands personal style. The Lily Short Set is my everyday uniform now — versatile and refined.",
    product: "Lily Short Set",
  },
  {
    id: 4,
    name: "Kemi B.",
    location: "Lagos",
    rating: 5,
    text: "From studio visit to fitting, the experience was memorable. Quality is never an afterthought here.",
    product: "Abeni Boubou",
  },
];

export const faqs = [
  {
    q: "Do you offer custom and bespoke styles?",
    a: "Yes. Within Bespoke, MKoS creates Custom/Bespoke for women and men, Aso Ebi, and Occasion Wear — alongside Ready-to-Wear and Bridal. Visit our Oniru studio or message us on WhatsApp to begin.",
  },
  {
    q: "Where is the MKoS studio?",
    a: "1, Ade Adedeji Close, Ayo Babatunde Crescent, Oniru, Lagos, Nigeria.",
  },
  {
    q: "How do I place an order or enquire about pricing?",
    a: "Browse the shop and add styles to your cart, or contact us on WhatsApp (08143173661 / 08104643052) or email mkosfashionhouse@gmail.com. Pricing will also be available via the admin catalogue as it is published.",
  },
  {
    q: "Do you design for men and bridal?",
    a: "Yes. MKoS Men offers contemporary menswear, and MKoS Bridal creates collections for brides, grooms, and wedding guests.",
  },
  {
    q: "Where can I follow MKoS?",
    a: "Instagram: @shopmykindofstyle (main) and @mkosformen (men).",
  },
];
