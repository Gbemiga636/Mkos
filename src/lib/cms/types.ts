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

export type Category = {
  slug: string;
  name: string;
  description: string;
  image_url?: string | null;
};

export type Collection = {
  slug: string;
  name: string;
  description: string;
  image: string;
  video?: string;
};

export type Review = {
  id: string | number;
  name: string;
  location: string;
  rating: number;
  text: string;
  product: string;
};

export type Faq = {
  id?: string;
  q: string;
  a: string;
};

export type SiteContentBlock = {
  key: string;
  section: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  eyebrow?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  extra?: Record<string, unknown>;
};

export type SiteSettings = {
  brand_name: string;
  tagline: string | null;
  logo_url: string | null;
  currency: string;
  locale: string;
  free_shipping_threshold: number;
  shipping_fee: number;
  social: Record<string, string>;
};

export type NavLink = {
  label: string;
  href: string;
  location: string;
};

export type CarouselSlide = {
  name: string;
  image_url: string;
  href: string | null;
};

export type CmsSnapshot = {
  settings: SiteSettings;
  products: Product[];
  categories: Category[];
  collections: Collection[];
  reviews: Review[];
  faqs: Faq[];
  content: Record<string, SiteContentBlock>;
  navigation: NavLink[];
  carousel: CarouselSlide[];
  newsletter: {
    eyebrow: string;
    title: string;
    subtitle: string;
    button_label: string;
  };
};

export function formatPrice(
  price: number,
  currency = "NGN",
  locale = "en-NG"
) {
  if (!price || price <= 0) return "Price on request";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
