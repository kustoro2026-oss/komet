"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PwaInstallBanner } from "@/components/layout/pwa-install-banner";
import { useSidebarStore } from "@/stores/sidebar-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { collapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)] dark:bg-[var(--color-surface-dark)]">
      {/* Top Navigation - Mobile only */}
      <TopNav onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Sidebar - Desktop & Tablet (always visible on md+), Mobile (drawer) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          "min-h-screen transition-all duration-normal",
          // Mobile: space for top nav (h-14) + bottom nav (~64px)
          "pt-16 pb-24",
          // Tablet (md) & Desktop: sidebar offset + breathing room
          "md:pt-8 md:pb-8 lg:pt-10 lg:pb-10",
          collapsed
            ? "md:pl-[80px]"
            : "md:pl-[272px]",
          // Horizontal padding — generous on desktop
          "px-4 sm:px-6 md:px-8 lg:px-12",
          // Full width on desktop (auto-fits available space)
          "md:w-auto",
          "bg-[var(--color-surface-dark)]"
        )}
      >
        {children}
      </main>

      {/* PWA Install Banner */}
      <PwaInstallBanner />

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
}
