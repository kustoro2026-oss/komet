"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { KometLogo } from "@/components/ui/komet-logo";

interface PageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--color-surface-dark)]/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <KometLogo size="sm" className="h-8 w-8 rounded-lg shadow-md shadow-[var(--color-primary)]/25" />
            <span className="text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="border-b border-white/[0.06] px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]"
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-base sm:text-lg text-[var(--color-on-dark-soft)] leading-relaxed"
            >
              {description}
            </motion.p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">{children}</div>
      </section>

      {/* Footer mini */}
      <footer className="border-t border-white/[0.06] px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs text-[var(--color-on-dark-muted)]">
            &copy; {new Date().getFullYear()} Komet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
