"use client";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/page-shell";
import { Zap, Bug, Star } from "lucide-react";
import { motion } from "framer-motion";
import { KometLogoIcon } from "@/components/ui/komet-logo";

export default function ChangelogPage() {
  const t = useTranslations("changelog");

  const changelog = [
    {
      date: "June 2026",
      title: t("v14Title"),
      icon: KometLogoIcon,
      items: [t("v14Item1"), t("v14Item2"), t("v14Item3")],
    },
    {
      date: "May 2026",
      title: t("v13Title"),
      icon: Zap,
      items: [t("v13Item1"), t("v13Item2")],
    },
    {
      date: "April 2026",
      title: t("v12Title"),
      icon: Bug,
      items: [t("v12Item1"), t("v12Item2")],
    },
    {
      date: "March 2026",
      title: t("v11Title"),
      icon: Star,
      items: [t("v11Item1"), t("v11Item2"), t("v11Item3")],
    },
  ];

  return (
    <PageShell title={t("title")} description={t("description")}>
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
