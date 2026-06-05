"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
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
          // Mobile: offset for top nav + bottom nav
          "pt-14 pb-14",
          // Tablet (md): offset for collapsed sidebar
          "md:ml-[72px] md:pb-0 md:pt-0",
          // Desktop (lg): offset depends on collapsed state
          collapsed ? "lg:ml-[72px]" : "lg:ml-[264px]",
          // Content styling
          "mx-auto max-w-[1280px] p-6",
          "bg-[var(--color-surface-dark)]"
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
}
