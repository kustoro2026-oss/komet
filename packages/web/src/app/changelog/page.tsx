"use client";
import { PageShell } from "@/components/page-shell";
import { Clock, Sparkles, Zap, Bug, Star } from "lucide-react";
import { motion } from "framer-motion";

const changelog = [
  {
    date: "June 2026",
    title: "v1.4 — Marquee platform showcase",
    icon: Sparkles,
    items: ["New auto-scrolling marquee on landing page for platform integrations", "Responsive padding improvements across all cards on mobile", "Footer redesigned with multi-column SaaS layout"],
  },
  {
    date: "May 2026",
    title: "v1.3 — Improved rendering",
    icon: Zap,
    items: ["Fixed GPU compositing artifacts on platform card section for Android Chrome", "Added will-change-transform and transform-gpu hints for smoother animations"],
  },
  {
    date: "April 2026",
    title: "v1.2 — Performance update",
    icon: Bug,
    items: ["Resolved cracked-glass rendering artifact caused by ultra-low opacity backgrounds", "Updated card backgrounds to use solid surface-dark-elevated colors"],
  },
  {
    date: "March 2026",
    title: "v1.1 — First stable release",
    icon: Star,
    items: ["15+ social platform integrations", "Scheduling, analytics, AI content generator, and unified inbox", "Mobile-responsive dashboard"],
  },
];

export default function ChangelogPage() {
  return (
    <PageShell title="Changelog" description="See what's new in Komet.">
      <div className="relative space-y-8">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.08] hidden sm:block" />

        {changelog.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <motion.div
              key={entry.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative pl-0 sm:pl-12"
            >
              {/* Timeline dot */}
              <div className="hidden sm:flex absolute left-0 top-1.5 h-[38px] w-[38px] items-center justify-center rounded-full border border-white/[0.08] bg-[var(--color-surface-dark-raised)]">
                <Icon className="h-4 w-4 text-[var(--color-primary)]" />
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-3 sm:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                    <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                  </div>
                  <span className="text-xs text-[var(--color-on-dark-muted)]">{entry.date}</span>
                </div>
                <div className="hidden sm:block mb-1">
                  <span className="text-xs text-[var(--color-on-dark-muted)]">{entry.date}</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-on-dark)]">{entry.title}</h3>
                <ul className="mt-2 space-y-1.5">
                  {entry.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-on-dark-soft)]">
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageShell>
  );
}
