"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PwaInstallBanner } from "@/components/layout/pwa-install-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Wait for client hydration before rendering sidebar
  // Prevents hydration mismatch from zustand persist (localStorage)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[auto_1fr] bg-[var(--color-surface-dark)]">
      {/* Sidebar — grid cell on desktop, overlay on mobile.
          Only rendered after hydration to avoid localStorage mismatch */}
      {hasMounted ? (
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          className="!relative !sticky !top-0 h-screen z-20"
        />
      ) : (
        /* SSR placeholder — invisible, same width as collapsed sidebar */
        <div className="hidden md:block w-[72px] h-screen shrink-0" />
      )}

      {/* Main Column — fills remaining space naturally */}
      <div className="flex flex-col min-h-screen min-w-0">
        {/* Top Navigation - Mobile only */}
        <TopNav onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Main Content — suppressHydrationWarning: child components use zustand persist stores */}
        <main
          suppressHydrationWarning
          className={cn(
            "flex-1 min-h-0",
            // Mobile: space for top nav (h-14) + bottom nav (~64px)
            "pt-16 pb-24",
            // Tablet (md) & Desktop: generous padding
            "md:pt-8 md:pb-8 lg:pt-10 lg:pb-10",
            // Horizontal padding — scales with viewport
            "px-4 sm:px-6 md:px-8 lg:px-12",
            "bg-[var(--color-surface-dark)]"
          )}
        >
          {children}
        </main>

        {/* Bottom Navigation - Mobile only */}
        <BottomNav />
      </div>

      {/* PWA Install Banner */}
      <PwaInstallBanner />
    </div>
  );
}
