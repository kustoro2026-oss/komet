"use client";
import { PageShell } from "@/components/page-shell";
import { HelpCircle, Search, MessageCircle, BookOpen } from "lucide-react";
import Link from "next/link";

const topics = [
  { icon: BookOpen, title: "Getting Started Guide", desc: "Connect accounts, create posts, and schedule content.", href: "/docs" },
  { icon: HelpCircle, title: "FAQ", desc: "Answers to common questions about billing, accounts, and features." },
  { icon: MessageCircle, title: "Contact Support", desc: "Reach our team for personalized help.", href: "/contact" },
];

export default function HelpPage() {
  return (
    <PageShell title="Help Center" description="Find answers, guides, and support.">
      <div className="space-y-8">
        {/* Search placeholder */}
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--color-on-dark-muted)]" />
          <span className="text-sm text-[var(--color-on-dark-muted)]">Search documentation and FAQs...</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {topics.map((t) => {
            const Icon = t.icon;
            const inner = (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group h-full">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/15 transition-colors">
                  <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-on-dark)] text-sm sm:text-base">{t.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{t.desc}</p>
              </div>
            );
            return t.href ? (
              <Link key={t.title} href={t.href}>
                {inner}
              </Link>
            ) : (
              <div key={t.title}>{inner}</div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
