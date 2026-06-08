"use client";
import { PageShell } from "@/components/page-shell";
import { Newspaper, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function BlogPage() {
  return (
    <PageShell title="Blog" description="Tips, updates, and stories from the Komet team.">
      <div className="text-center py-16">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
            <Newspaper className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-2">Coming Soon</h2>
        <p className="text-[var(--color-on-dark-soft)] max-w-md mx-auto leading-relaxed">
          We&rsquo;re preparing our first articles on social media strategy, platform tips, and product updates. Stay tuned!
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Back to Komet
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </PageShell>
  );
}
