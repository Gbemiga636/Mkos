"use client";

import { Suspense } from "react";
import { SuccessClient } from "./SuccessClient";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-mkos-warm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-mkos-ink/15 border-t-mkos-accent" />
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
