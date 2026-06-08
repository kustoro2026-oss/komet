"use client";
import { PageShell } from "@/components/page-shell";
import { Briefcase, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function CareersPage() {
  return (
    <PageShell title="Careers" description="Help us build the future of social media management.">
      <div className="text-center py-16">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
            <Briefcase className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-2">No Open Positions Yet</h2>
        <p className="text-[var(--color-on-dark-soft)] max-w-md mx-auto leading-relaxed">
          We&rsquo;re a small, fast-moving team. When we&rsquo;re hiring, you&rsquo;ll be the first to know. Check back soon!
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
