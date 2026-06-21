"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search, UserCheck, ArrowRight, Wrench, Download, Image as ImageIcon, Video } from "lucide-react";

interface ToolItem {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  href: string;
  available: boolean;
}

export default function ToolsPage() {
  const t = useTranslations("tools");

  const tools: ToolItem[] = [
    {
      id: "tiktok-username-checker",
      icon: UserCheck,
      titleKey: "tiktokCheckerTitle",
      descKey: "tiktokCheckerDesc",
      href: "/tool/tiktok-username-checker",
      available: true,
    },
    {
      id: "tiktok-downloader",
      icon: Download,
      titleKey: "tiktokDownloaderTitle",
      descKey: "tiktokDownloaderDesc",
      href: "/tool/tiktok-downloader",
      available: true,
    },
    {
      id: "youtube-thumbnail-downloader",
      icon: ImageIcon,
      titleKey: "youtubeThumbnailTitle",
      descKey: "youtubeThumbnailDesc",
      href: "/tool/youtube-thumbnail-downloader",
      available: true,
    },
    {
      id: "instagram-downloader",
      icon: Video,
      titleKey: "instagramDownloaderTitle",
      descKey: "instagramDownloaderDesc",
      href: "/tool/instagram-downloader",
      available: true,
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-white/[0.06] px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-medium text-white/50">
              <Wrench className="h-3.5 w-3.5" />
              {t("sectionLabel")}
            </div>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-[var(--color-on-dark-soft)] leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Link
                    href={tool.href}
                    className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/15 transition-colors">
                      <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[var(--color-on-dark)] text-sm sm:text-base">
                        {t(tool.titleKey)}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-[var(--color-on-dark-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="mt-1.5 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">
                      {t(tool.descKey)}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {tools.length === 0 && (
            <div className="text-center py-16">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <Search className="h-6 w-6 text-[var(--color-on-dark-muted)]" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-on-dark)]">
                {t("noToolsYet")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-on-dark-soft)]">
                {t("noToolsDesc")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
