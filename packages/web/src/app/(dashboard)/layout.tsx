"use client";

import { useState } from "react";
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

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[auto_1fr] bg-[var(--color-surface-dark)]">
      {/* Sidebar — grid cell on desktop (un-fixed), overlay on mobile */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        className="!relative !sticky !top-0 h-screen z-20"
      />

      {/* Main Column — fills remaining space naturally */}
      <div className="flex flex-col min-h-screen min-w-0">
        {/* Top Navigation - Mobile only */}
        <TopNav onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Main Content */}
        <main
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
