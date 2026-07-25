import { Hero } from "@/components/home/Hero";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { NewArrivals, Trending, BestSellers } from "@/components/home/ProductRails";
import { CampaignSection } from "@/components/home/CampaignSection";
import { EditorialStory, FeaturedVideo } from "@/components/home/Editorial";
import {
  CollectionCarousel,
  CategoryGrid,
  BrandStory,
  Reviews,
  InstagramGallery,
  Newsletter,
  FAQ,
  Marquee,
} from "@/components/home/MoreSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedCollection />
      <NewArrivals />
      <Trending />
      <BestSellers />
      <CampaignSection />
      <EditorialStory />
      <FeaturedVideo />
      <CollectionCarousel />
      <CategoryGrid />
      <BrandStory />
      <Reviews />
      <InstagramGallery />
      <Newsletter />
      <FAQ />
    </>
  );
}
