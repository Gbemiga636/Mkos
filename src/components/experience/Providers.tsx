"use client";

import { IntroLoader } from "./IntroLoader";
import { CustomCursor } from "./CustomCursor";
import { SmoothScroll } from "./SmoothScroll";
import { PageTransition } from "./PageTransition";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { CartDrawer } from "@/components/layout/CartDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <IntroLoader />
      <CustomCursor />
      <Header />
      <SearchOverlay />
      <CartDrawer />
      <PageTransition>
        <main id="main">{children}</main>
      </PageTransition>
      <Footer />
    </SmoothScroll>
  );
}
