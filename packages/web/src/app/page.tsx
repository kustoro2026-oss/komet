"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { PlatformIcon } from "@/components/ui/platform-icon";
import {
  Calendar,
  Share2,
  BarChart3,
  Bot,
  ArrowRight,
  CheckCircle,
  Zap,
  MessageCircle,
  Menu,
  X,
  Users,
  Globe,
  Star,
} from "lucide-react";
import { HeaderLanguageSwitcher } from "@/components/layout/header-language-switcher";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Platform } from "@komet/shared";
import { KometLogo } from "@/components/ui/komet-logo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-medium tracking-wide text-white/50">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
      {children}
    </span>
  );
}

export default function LandingPage() {
  const t = useTranslations("landing");
  const [mobileMenu, setMobileMenu] = useState(false);

  const allPlatforms: { id: Platform; label: string }[] = [
    { id: "twitter", label: "Twitter / X" },
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" },
    { id: "youtube", label: "YouTube" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "threads", label: "Threads" },
    { id: "tiktok", label: "TikTok" },
    { id: "pinterest", label: "Pinterest" },
    { id: "reddit", label: "Reddit" },
    { id: "bluesky", label: "Bluesky" },
    { id: "telegram", label: "Telegram" },
    { id: "discord", label: "Discord" },
    { id: "snapchat", label: "Snapchat" },
    { id: "googlebusiness", label: "Google Business" },
    { id: "whatsapp", label: "WhatsApp" },
  ];

  const features = [
    {
      icon: Calendar,
      titleKey: "visualCalendar",
      descKey: "visualCalendarDesc",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Share2,
      titleKey: "multiPlatform",
      descKey: "multiPlatformDesc",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: BarChart3,
      titleKey: "advancedAnalytics",
      descKey: "advancedAnalyticsDesc",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Bot,
      titleKey: "aiGenerator",
      descKey: "aiGeneratorDesc",
      gradient: "from-orange-500 to-rose-500",
    },
    {
      icon: MessageCircle,
      titleKey: "unifiedInbox",
      descKey: "unifiedInboxDesc",
      gradient: "from-pink-500 to-red-500",
    },
    {
      icon: Zap,
      titleKey: "smartQueue",
      descKey: "smartQueueDesc",
      gradient: "from-amber-500 to-yellow-500",
    },
  ];

  const planKeys = ["free", "creator", "pro", "business"];
  const planPopular: Record<string, boolean> = {
    free: false,
    creator: true,
    pro: false,
    business: false,
  };

  const quickStats = [
    { value: "15+", labelKey: "statsPlatforms" },
    { value: "10K+", labelKey: "statsPosts" },
    { value: "99.9%", labelKey: "statsUptime" },
    { value: "4.9★", labelKey: "statsRating" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* ===== NAVBAR ===== */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[var(--color-surface-dark)]/70 backdrop-blur-2xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <KometLogo size="sm" className="h-8 w-8 rounded-lg shadow-md shadow-[var(--color-primary)]/25" />
            <span className="text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("navFeatures")}</a>
            <a href="#pricing" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("navPricing")}</a>
            <HeaderLanguageSwitcher />
            <Link href="/login" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("login")}</Link>
            <Link href="/register" className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-md shadow-[var(--color-primary)]/20">{t("startFree")}</Link>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="flex items-center md:hidden" aria-label={t("mobileMenu")}>
            {mobileMenu ? <X className="h-5 w-5 text-[var(--color-on-dark)]" /> : <Menu className="h-5 w-5 text-[var(--color-on-dark)]" />}
          </button>
        </nav>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-white/[0.06] bg-[var(--color-surface-dark)] px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#features" onClick={() => setMobileMenu(false)} className="text-sm text-[var(--color-on-dark-soft)]">{t("navFeatures")}</a>
              <a href="#pricing" onClick={() => setMobileMenu(false)} className="text-sm text-[var(--color-on-dark-soft)]">{t("navPricing")}</a>
              <HeaderLanguageSwitcher />
              <Link href="/login" onClick={() => setMobileMenu(false)} className="text-sm text-[var(--color-on-dark-soft)]">{t("login")}</Link>
              <Link href="/register" onClick={() => setMobileMenu(false)} className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">{t("startFree")}</Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ===== HERO (text only — with background image) ===== */}
      <section className="relative overflow-hidden pt-16 pb-12 sm:pb-16">
        {/* Background image */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-[var(--color-surface-dark)]/85" />
        </div>
        {/* Background glow — reduced blur on mobile to prevent GPU artifacts */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute left-1/3 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[var(--color-primary)]/10 blur-[60px] sm:blur-[150px]" />
          <div className="absolute right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[50px] sm:blur-[120px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pt-20">
          {/* Hero content */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-4xl text-center">
            {/* Live badge */}
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-400/80">{t("heroBadge")}</span>
            </div>

            <h1 className="font-display text-balance text-4xl font-bold leading-[1.1] text-white sm:text-5xl md:text-7xl [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]">
              {t("heroTitle")}{" "}
              <span className="bg-gradient-to-r from-[var(--color-primary)] via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("heroEmphasis")}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl px-2 text-base sm:text-lg text-white/80 leading-relaxed [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">{t("heroSubtitle")}</p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="group inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/25 hover:shadow-[var(--color-primary)]/35">
                {t("startFree")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white/80 hover:bg-white/[0.06] hover:text-white transition-all">{t("signIn")}</Link>
            </motion.div>

           <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }} className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium text-white/70 [text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> {t("heroNoCreditCard")}</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> {t("heroFreeForever")}</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> {t("heroCancelAnytime")}</span>
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ===== DEMO (platform toggle + video — no background image) ===== */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6">
          {/* Platform toggle (inspired by Buffer) */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-wrap items-center justify-center gap-2.5">
            {allPlatforms.slice(0, 8).map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] px-3.5 py-1.5 text-xs text-[var(--color-on-dark-soft)]">
                <PlatformIcon platform={p.id} className="h-3.5 w-3.5" />
                {p.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] px-3.5 py-1.5 text-xs text-[var(--color-on-dark-soft)]">{t("plusMore")}</span>
          </motion.div>

          {/* Auto-playing video — loops endlessly */}
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="relative mt-14 w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.15] shadow-2xl shadow-black/50">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-video object-cover"
              >
                <source src="/videos/hero-demo.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="absolute -bottom-8 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/10 blur-[30px] sm:blur-[60px]" />
          </motion.div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF STATS (like Buffer, Hootsuite) ===== */}
      <section className="border-t border-white/[0.06] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <SectionLabel>{t("trustedBy")}</SectionLabel>
          </motion.div>
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] md:grid-cols-4">
            {quickStats.map((stat, i) => (
              <motion.div key={stat.labelKey} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="bg-[var(--color-surface-dark)] p-5 sm:p-8 text-center">
                <p className="font-display text-4xl font-bold text-[var(--color-on-dark)]">{stat.value}</p>
                <p className="mt-1.5 text-sm text-[var(--color-on-dark-muted)]">{t(stat.labelKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS (inspired by Buffer's simplicity) ===== */}
      <section className="border-t border-white/[0.06] px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <SectionLabel>{t("howItWorks")}</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]">{t("howItWorksTitle")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-[var(--color-on-dark-soft)]">{t("howItWorksSubtitle")}</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { step: "01", icon: Globe, titleKey: "step1Title", descKey: "step1Desc" },
              { step: "02", icon: Calendar, titleKey: "step2Title", descKey: "step2Desc" },
              { step: "03", icon: BarChart3, titleKey: "step3Title", descKey: "step3Desc" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.step} variants={fadeUp} custom={i} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 transition-all duration-300 hover:border-white/10">
                  <span className="font-display absolute right-5 top-4 select-none text-4xl sm:text-5xl font-bold leading-none text-white/[0.04]">{step.step}</span>
                  <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 shadow-lg shadow-[var(--color-primary)]/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="relative z-10 text-lg font-semibold text-[var(--color-on-dark)]">{t(step.titleKey)}</h3>
                  <p className="relative z-10 mt-2 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{t(step.descKey)}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== CORE FEATURES (inspired by Sprout Social + Buffer) ===== */}
      <section className="border-t border-white/[0.06] px-4 sm:px-6 py-16 sm:py-24" id="features">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <SectionLabel>{t("sectionFeatures")}</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]">{t("featuresHeadingLine1")}</h2>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]">
              {t("featuresHeadingLine2Prefix")} <span className="bg-gradient-to-r from-[var(--color-primary)] to-purple-400 bg-clip-text text-transparent">{t("featuresHeadingLine2Highlight")}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">{t("featuresSubtitle")}</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.titleKey} variants={fadeUp} custom={i} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
                  <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent" />
                  </div>
                  <div className={`relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-md ${f.gradient}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="relative z-10 text-base font-semibold text-[var(--color-on-dark)]">{t(f.titleKey)}</h3>
                  <p className="relative z-10 mt-1.5 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{t(f.descKey)}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== DASHBOARD SHOWCASE with checklist (inspired by Hootsuite) ===== */}
      <section className="border-t border-white/[0.06] px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SectionLabel>{t("sectionAnalytics")}</SectionLabel>
              <h2 className="mt-4 font-display text-3xl font-bold text-[var(--color-on-dark)] sm:text-4xl">{t("analyticsTitle")}</h2>
              <p className="mt-4 text-[var(--color-on-dark-soft)] leading-relaxed">{t("analyticsDesc")}</p>
              <ul className="mt-6 space-y-3">
                {[
                  t("analyticsCheck1"),
                  t("analyticsCheck2"),
                  t("analyticsCheck3"),
                  t("analyticsCheck4"),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[var(--color-on-dark-soft)]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl shadow-black/40">
                <Image src="/images/analytics-preview.jpg" alt="Komet Analytics Dashboard" width={1200} height={800} className="w-full object-cover" />
              </div>
              <div className="pointer-events-none absolute -bottom-1 -left-1 -right-1 h-1/2 bg-gradient-to-t from-[var(--color-surface-dark)] to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WHO IT'S FOR — Audience segments (inspired by Buffer) ===== */}
      <section className="border-t border-white/[0.06] px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <SectionLabel>{t("sectionAudience")}</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]">{t("audienceTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">{t("audienceSubtitle")}</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Star,
                titleKey: "audienceCreators",
                itemsKey: "audienceCreatorsItems",
                gradient: "from-violet-500 to-purple-500",
              },
              {
                icon: Users,
                titleKey: "audienceTeams",
                itemsKey: "audienceTeamsItems",
                gradient: "from-blue-500 to-cyan-500",
                featured: true,
              },
              {
                icon: Globe,
                titleKey: "audienceAgencies",
                itemsKey: "audienceAgenciesItems",
                gradient: "from-emerald-500 to-teal-500",
              },
            ].map((segment, i) => {
              const Icon = segment.icon;
              const segmentItems = t.raw(segment.itemsKey) as string[];
              return (
                <motion.div key={segment.titleKey} variants={fadeUp} custom={i} className={`relative rounded-2xl border p-6 sm:p-8 ${
                  segment.featured
                    ? "border-[var(--color-primary)]/40 bg-gradient-to-b from-[var(--color-primary)]/[0.08] to-transparent"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}>
                  {segment.featured && <div className="absolute inset-x-0 -top-px mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />}
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${segment.gradient} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-on-dark)]">{t(segment.titleKey)}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {segmentItems.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--color-on-dark-soft)]">
                        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== ALL PLATFORMS — Auto-scrolling Marquee ===== */}
      <section className="border-t border-white/[0.06] py-14 sm:py-20 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <SectionLabel>{t("sectionIntegrations")}</SectionLabel>
            <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-[var(--color-on-dark)]">{t("integrationsTitle")}</h2>
          </motion.div>
        </div>
        {/* Row 1 — scroll left */}
        <div className="mt-10 overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
          <div className="flex w-max gap-3 animate-marquee-left animate-marquee-paused px-4">
            {[...allPlatforms, ...allPlatforms].map((p, i) => (
              <div key={`${p.id}-a-${i}`} className="flex items-center gap-2 sm:gap-3 rounded-xl border border-white/[0.10] bg-white/[0.05] px-3 sm:px-4 py-3 sm:py-3.5 shrink-0">
                <PlatformIcon platform={p.id} className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm text-[var(--color-on-dark-soft)] whitespace-nowrap">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Row 2 — scroll right */}
        <div className="mt-3 overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
          <div className="flex w-max gap-3 animate-marquee-right animate-marquee-paused px-4">
            {[...allPlatforms.slice().reverse(), ...allPlatforms.slice().reverse()].map((p, i) => (
              <div key={`${p.id}-b-${i}`} className="flex items-center gap-2 sm:gap-3 rounded-xl border border-white/[0.10] bg-white/[0.05] px-3 sm:px-4 py-3 sm:py-3.5 shrink-0">
                <PlatformIcon platform={p.id} className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm text-[var(--color-on-dark-soft)] whitespace-nowrap">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="border-t border-white/[0.06] px-4 sm:px-6 py-16 sm:py-24" id="pricing">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <SectionLabel>{t("sectionPricing")}</SectionLabel>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]">{t("pricingTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">{t("pricingSubtitle")}</p>
          </motion.div>
          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {planKeys.map((planId, i) => {
              const popular = planPopular[planId];
              const planKey = planId === "free" ? "planFree" : planId === "creator" ? "planCreator" : planId === "pro" ? "planPro" : "planBusiness";
              const features = t.raw(`${planKey}Features`) as string[];
              return (
                <motion.div key={planId} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                  className={`relative rounded-2xl border p-6 ${popular ? "border-[var(--color-primary)]/50 bg-gradient-to-b from-[var(--color-primary)]/[0.08] to-transparent" : "border-white/[0.06] bg-white/[0.02]"}`}>
                  {popular && (
                    <>
                      <div className="absolute inset-x-0 -top-px mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />
                      <span className="mb-3 inline-block rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-[11px] font-semibold text-white">{t("mostPopular")}</span>
                    </>
                  )}
                  <h3 className="text-lg font-semibold text-[var(--color-on-dark)]">{t(planKey)}</h3>
                  <p className="mt-1 flex items-baseline gap-0.5">
                    <span className="font-display text-3xl font-bold text-[var(--color-on-dark)]">{t(`${planKey}Price`)}</span>
                    <span className="text-sm text-[var(--color-on-dark-muted)]">{t("perMonth")}</span>
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {features.map((feature: string) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--color-on-dark-soft)]">
                        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`mt-8 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    popular ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-lg shadow-[var(--color-primary)]/20" : "border border-white/10 text-[var(--color-on-dark-soft)] hover:bg-white/[0.04] hover:text-[var(--color-on-dark)]"
                  }`}>{t("getStarted")}</Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-t border-white/[0.06] px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[var(--color-primary)]/[0.08] via-purple-600/[0.04] to-transparent p-6 sm:p-12 text-center">
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/15 blur-[100px]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-[var(--color-on-dark)] sm:text-4xl">{t("ctaTitle")}</h2>
              <p className="mx-auto mt-4 max-w-lg text-[var(--color-on-dark-soft)]">{t("ctaSubtitle")}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3 text-base font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/25">
                  {t("startFree")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-[var(--color-on-dark-muted)]">{t("ctaFooter")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] bg-[var(--color-surface-dark)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
          {/* Brand row */}
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <KometLogo size="sm" className="h-8 w-8 rounded-lg shadow-md shadow-[var(--color-primary)]/20" />
              <span className="text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
            </Link>
            <p className="mt-3 max-w-md text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{t("footerTagline")}</p>
          </div>

          {/* 4 equal columns: PRODUCT | RESOURCES | COMPANY | LEGAL */}
          <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4">
            {/* Product */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)] mb-4">{t("footerProduct")}</h3>
              <ul className="space-y-2.5">
                <li><a href="#features" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerFeatures")}</a></li>
                <li><a href="#pricing" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerPricing")}</a></li>
                <li><Link href="/integrations" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerIntegrations")}</Link></li>
                <li><Link href="/changelog" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerChangelog")}</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)] mb-4">{t("footerResources")}</h3>
              <ul className="space-y-2.5">
                <li><Link href="/docs" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerDocumentation")}</Link></li>
                <li><Link href="/docs/api" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerApiReference")}</Link></li>
                <li><Link href="/blog" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerBlog")}</Link></li>
                <li><Link href="/help" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerHelpCenter")}</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)] mb-4">{t("footerCompany")}</h3>
              <ul className="space-y-2.5">
                <li><Link href="/about" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerAbout")}</Link></li>
                <li><Link href="/careers" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerCareers")}</Link></li>
                <li><Link href="/contact" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerContact")}</Link></li>
                <li><Link href="/status" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerStatus")}</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)] mb-4">{t("footerLegal")}</h3>
              <ul className="space-y-2.5">
                <li><Link href="/privacy" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerPrivacy")}</Link></li>
                <li><Link href="/terms" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerTerms")}</Link></li>
                <li><Link href="/cookies" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footerCookies")}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="border-t border-white/[0.06]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 py-5 sm:flex-row">
            <p className="text-xs text-[var(--color-on-dark-muted)]">&copy; {new Date().getFullYear()} Komet. {t("allRightsReserved")}</p>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="text-xs text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark-soft)] transition-colors">{t("footerPrivacy")}</Link>
              <Link href="/terms" className="text-xs text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark-soft)] transition-colors">{t("footerTerms")}</Link>
              <Link href="/cookies" className="text-xs text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark-soft)] transition-colors">{t("footerCookies")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
