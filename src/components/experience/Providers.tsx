"use client";

import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { IntroLoader } from "./IntroLoader";
import { CustomCursor } from "./CustomCursor";
import { SmoothScroll } from "./SmoothScroll";
import { PageTransition } from "./PageTransition";
import { GlobalSpinner } from "./GlobalSpinner";
import { BackToTop } from "./BackToTop";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { NewsletterPopup } from "@/components/layout/NewsletterPopup";
import { SiteAssistant } from "@/components/ai/SiteAssistant";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { EditModeProvider, useEditMode } from "@/components/cms/EditableSection";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { CmsProvider } from "@/lib/cms/CmsProvider";
import { CurrencyProvider } from "@/components/currency/CurrencyProvider";
import { CurrencySwitcher } from "@/components/currency/CurrencySwitcher";
import type { CmsSnapshot } from "@/lib/cms/types";

function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const editMode = useEditMode();

  return (
    <MotionConfig reducedMotion="never">
      <SmoothScroll>
        {!editMode && <IntroLoader />}
        {!editMode && <CustomCursor />}
        <GlobalSpinner />
        {!editMode && <AnalyticsTracker />}
        <Header />
        {!editMode && <SearchOverlay />}
        {!editMode && <CartDrawer />}
        {!editMode && <SiteAssistant />}
        {!editMode && <BackToTop />}
        {!editMode && <NewsletterPopup />}
        {!editMode && <CurrencySwitcher />}
        <PageTransition>
          <main id="main">{children}</main>
        </PageTransition>
        <Footer />
      </SmoothScroll>
    </MotionConfig>
  );
}

export function Providers({
  children,
  cms,
}: {
  children: React.ReactNode;
  cms: CmsSnapshot;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <CmsProvider value={cms}>
      <AuthProvider>
        {isAdmin ? (
          <>{children}</>
        ) : (
          <CurrencyProvider>
            <EditModeProvider>
              <StorefrontChrome>{children}</StorefrontChrome>
            </EditModeProvider>
          </CurrencyProvider>
        )}
      </AuthProvider>
    </CmsProvider>
  );
}
