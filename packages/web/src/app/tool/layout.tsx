"use client";

import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { KometLogo } from "@/components/ui/komet-logo";

interface ToolLayoutProps {
  children: ReactNode;
}

export default function ToolLayout({ children }: ToolLayoutProps) {
  const t = useTranslations("tools");

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--color-surface-dark)]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <KometLogo size="sm" className="h-8 w-8 rounded-lg shadow-md shadow-[var(--color-primary)]/25" />
            <span className="text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/tool"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              <Wrench className="h-4 w-4" />
              {t("navLabel")}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToHome")}
            </Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 sm:px-6 py-6 mt-auto">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs text-[var(--color-on-dark-muted)]">
            &copy; {new Date().getFullYear()} Komet. {t("copyright")}
          </p>
        </div>
      </footer>
    </div>
  );
}
