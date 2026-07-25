"use client";

import { usePathname } from "next/navigation";
import { IntroLoader } from "./IntroLoader";
import { CustomCursor } from "./CustomCursor";
import { SmoothScroll } from "./SmoothScroll";
import { PageTransition } from "./PageTransition";
import { GlobalSpinner } from "./GlobalSpinner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { SiteAssistant } from "@/components/ai/SiteAssistant";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { EditModeProvider, useEditMode } from "@/components/cms/EditableSection";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { CmsProvider } from "@/lib/cms/CmsProvider";
import type { CmsSnapshot } from "@/lib/cms/types";

function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const editMode = useEditMode();

  return (
    <SmoothScroll>
      {!editMode && <IntroLoader />}
      {!editMode && <CustomCursor />}
      <GlobalSpinner />
      {!editMode && <AnalyticsTracker />}
      <Header />
      {!editMode && <SearchOverlay />}
      {!editMode && <CartDrawer />}
      {!editMode && <AuthModal />}
      {!editMode && <SiteAssistant />}
      <PageTransition>
        <main id="main">{children}</main>
      </PageTransition>
      <Footer />
    </SmoothScroll>
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
          <EditModeProvider>
            <StorefrontChrome>{children}</StorefrontChrome>
          </EditModeProvider>
        )}
      </AuthProvider>
    </CmsProvider>
  );
}
