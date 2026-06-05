import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Komet — Social Media Scheduling Platform",
  description:
    "Your content blasts to every platform in a flash. A 3-in-1 social media scheduling platform for creators, teams, and developers.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* Simple nav */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/80 backdrop-blur-md px-6">
        <Link href="/" className="flex items-center gap-2">
          <svg className="h-7 w-7" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#logo-gradient)" />
            <path d="M8 14L12 10L16 14L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="14" cy="17" r="3" fill="white" fillOpacity="0.3" />
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>
          <span className="font-display text-xl font-bold text-[var(--color-on-dark)]">Komet</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-body-sm font-medium text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-5 py-2.5 text-button-sm font-medium text-white hover:opacity-90 transition-opacity shadow-glow"
          >
            Get Started Free
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
