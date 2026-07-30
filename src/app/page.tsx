import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { NewArrivals, BestSellers } from "@/components/home/ProductRails";
import { CampaignSection } from "@/components/home/CampaignSection";
import { EditorialStory, FeaturedVideo } from "@/components/home/Editorial";
import {
  CollectionCarousel,
  CategoryGrid,
  BrandStory,
  Reviews,
  InstagramGallery,
  FAQ,
  Marquee,
} from "@/components/home/MoreSections";
import { EditableSection } from "@/components/cms/EditableSection";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    path: "/",
  }),
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
};

export default function HomePage() {
  return (
    <>
      <EditableSection cmsKey="hero" label="Hero">
        <Hero />
      </EditableSection>
      <EditableSection cmsKey="marquee" label="Marquee">
        <Marquee />
      </EditableSection>
      <EditableSection cmsKey="featured_collections" label="Collections">
        <FeaturedCollection />
      </EditableSection>
      <EditableSection cmsKey="new_arrivals" label="New arrivals">
        <NewArrivals />
      </EditableSection>
      <EditableSection cmsKey="best_sellers" label="Best sellers">
        <BestSellers />
      </EditableSection>
      <EditableSection cmsKey="campaign" label="Campaign video">
        <CampaignSection />
      </EditableSection>
      <EditableSection cmsKey="editorial" label="Editorial">
        <EditorialStory />
      </EditableSection>
      <EditableSection cmsKey="featured_video" label="MKoS in motion">
        <FeaturedVideo />
      </EditableSection>
      <EditableSection cmsKey="brand_story" label="Brand story">
        <BrandStory />
      </EditableSection>
      <EditableSection cmsKey="carousel" label="Carousel">
        <CollectionCarousel />
      </EditableSection>
      <EditableSection cmsKey="categories" label="Categories">
        <CategoryGrid />
      </EditableSection>
      <EditableSection cmsKey="reviews" label="Reviews">
        <Reviews />
      </EditableSection>
      <EditableSection cmsKey="instagram" label="Instagram">
        <InstagramGallery />
      </EditableSection>
      <EditableSection cmsKey="faq" label="FAQ">
        <FAQ />
      </EditableSection>
    </>
  );
}
