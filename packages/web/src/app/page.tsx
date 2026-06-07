"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { PlatformIcon } from "@/components/ui/platform-icon";
import {
  Sparkles,
  Calendar,
  Share2,
  BarChart3,
  Bot,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  MessageCircle,
  Layers,
  Clock,
  Users,
  Menu,
  X,
} from "lucide-react";
import { HeaderLanguageSwitcher } from "@/components/layout/header-language-switcher";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import type { Platform } from "@komet/shared";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-medium tracking-wide text-white/50">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
      {children}
    </span>
  );
}

export default function LandingPage() {
  const t = useTranslations("landing");
  const [mobileMenu, setMobileMenu] = useState(false);

  const platforms: { id: Platform; label: string }[] = [
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
  const marqueePlatforms = [...platforms, ...platforms, ...platforms];

  const featureKeys = [
    {
      key: "visualCalendar",
      icon: Calendar,
      badge: "Schedule",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      key: "multiPlatform",
      icon: Share2,
      badge: "Publish",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      key: "advancedAnalytics",
      icon: BarChart3,
      badge: "Analyze",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      key: "aiGenerator",
      icon: Bot,
      badge: "Create",
      gradient: "from-orange-500 to-rose-500",
    },
    {
      key: "unifiedInbox",
      icon: MessageCircle,
      badge: "Engage",
      gradient: "from-pink-500 to-red-500",
    },
    {
      key: "smartQueue",
      icon: Zap,
      badge: "Optimize",
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

  const stats = [
    { value: "15+", label: "Platform Supported" },
    { value: "10K+", label: "Posts Scheduled" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9★", label: "User Rating", icon: Star },
  ];

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
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

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* ===== NAVBAR ===== */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[var(--color-surface-dark)]/70 backdrop-blur-2xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] shadow-md shadow-[var(--color-primary)]/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              Pricing
            </a>
            <HeaderLanguageSwitcher />
            <Link
              href="/login"
              className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-all shadow-md shadow-[var(--color-primary)]/20"
            >
              {t("startFree")}
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="flex items-center md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? (
              <X className="h-5 w-5 text-[var(--color-on-dark)]" />
            ) : (
              <Menu className="h-5 w-5 text-[var(--color-on-dark)]" />
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/[0.06] bg-[var(--color-surface-dark)] px-6 py-4 md:hidden"
          >
            <div className="flex flex-col gap-3">
              <a
                href="#features"
                onClick={() => setMobileMenu(false)}
                className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenu(false)}
                className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
              >
                Pricing
              </a>
              <HeaderLanguageSwitcher />
              <Link
                href="/login"
                onClick={() => setMobileMenu(false)}
                className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenu(false)}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                {t("startFree")}
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden pt-16">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/3 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[var(--color-primary)]/10 blur-[150px]" />
          <div className="absolute right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[100px]" />
        </div>

        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <motion.div
          style={{ y: heroY }}
          className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center px-6 pt-20 pb-16"
        >
          {/* Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl text-center"
          >
            {/* Live badge */}
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-400/80">
                Now supporting 15+ platforms
              </span>
            </div>

            <h1 className="font-display text-balance text-5xl font-bold leading-[1.1] text-[var(--color-on-dark)] sm:text-6xl md:text-7xl">
              {t("heroTitle")}{" "}
              <span className="bg-gradient-to-r from-[var(--color-primary)] via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("heroEmphasis")}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-on-dark-soft)] leading-relaxed">
              {t("heroSubtitle")}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3.5 text-base font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/25 hover:shadow-[var(--color-primary)]/35"
              >
                {t("startFree")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-semibold text-[var(--color-on-dark-soft)] hover:bg-white/[0.04] hover:text-[var(--color-on-dark)] transition-all"
              >
                {t("signIn")}
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--color-on-dark-muted)]"
            >
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" /> No credit card
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" /> Free forever plan
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" /> Cancel anytime
              </span>
            </motion.p>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative mt-16 w-full max-w-6xl"
          >
            <div className="relative rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-1 shadow-2xl shadow-black/50">
              <div className="overflow-hidden rounded-lg">
                <Image
                  src="/images/dashboard-preview.jpg"
                  alt="Komet Dashboard Interface"
                  width={1200}
                  height={675}
                  className="w-full object-cover"
                  priority
                />
              </div>
              {/* Bottom fade */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--color-surface-dark)] to-transparent" />
            </div>
            {/* Glow under mockup */}
            <div className="absolute -bottom-16 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/15 blur-[80px]" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== PLATFORM MARQUEE ===== */}
      <section className="border-t border-white/[0.06] py-16">
        <div className="mx-auto mb-6 max-w-7xl px-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-on-dark-muted)]">
            Connect all your platforms
          </p>
        </div>
        <div className="relative overflow-hidden">
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--color-surface-dark)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--color-surface-dark)] to-transparent" />
          <motion.div
            className="flex gap-3"
            animate={{ x: ["0%", "-33.33%"] }}
            transition={{
              duration: 35,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {marqueePlatforms.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="flex shrink-0 items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
              >
                <PlatformIcon platform={p.id} className="h-4 w-4" />
                <span className="whitespace-nowrap text-sm text-[var(--color-on-dark-soft)]">
                  {p.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="border-t border-white/[0.06] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-[var(--color-surface-dark)] p-8 text-center"
              >
                <p className="font-display text-4xl font-bold text-[var(--color-on-dark)]">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm text-[var(--color-on-dark-muted)]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-4 font-display text-4xl font-bold text-[var(--color-on-dark)]">
              Three steps to launch
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[var(--color-on-dark-soft)]">
              Connect, create, and publish — it&apos;s that simple.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 grid gap-8 md:grid-cols-3"
          >
            {[
              {
                step: "01",
                icon: Share2,
                title: "Connect accounts",
                desc: "Link your social media profiles with one click OAuth. We support 15+ platforms.",
              },
              {
                step: "02",
                icon: Calendar,
                title: "Schedule content",
                desc: "Drag & drop your posts onto the calendar. AI helps find the best times to publish.",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Track performance",
                desc: "Monitor engagement, growth, and ROI across all platforms from one dashboard.",
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  variants={fadeUp}
                  custom={i}
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/10"
                >
                  <span className="font-display text-5xl font-bold text-white/[0.04] absolute right-5 top-4 select-none leading-none">
                    {step.step}
                  </span>
                  <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 shadow-lg shadow-[var(--color-primary)]/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="relative z-10 text-lg font-semibold text-[var(--color-on-dark)]">
                    {step.title}
                  </h3>
                  <p className="relative z-10 mt-2 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="border-t border-white/[0.06] px-6 py-24" id="features">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <SectionLabel>Features</SectionLabel>
            <h2 className="mt-4 font-display text-4xl font-bold text-[var(--color-on-dark)]">
              {t("featuresTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">
              {t("featuresSubtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {featureKeys.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.key}
                  variants={fadeUp}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  {/* Hover glow */}
                  <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent" />
                  </div>

                  <div className="relative z-10 mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient} shadow-md`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="relative z-10 text-base font-semibold text-[var(--color-on-dark)]">
                    {t(`${f.key}`)}
                  </h3>
                  <p className="relative z-10 mt-1.5 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">
                    {t(`${f.key}Desc`)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== DASHBOARD SHOWCASE ===== */}
      <section className="border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <SectionLabel>Analytics</SectionLabel>
              <h2 className="mt-4 font-display text-3xl font-bold text-[var(--color-on-dark)] sm:text-4xl">
                Measure what matters
              </h2>
              <p className="mt-4 text-[var(--color-on-dark-soft)] leading-relaxed">
                Track engagement, follower growth, and top-performing content across all your
                platforms. Beautiful charts, exportable reports, and real-time data.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Real-time engagement metrics",
                  "Cross-platform comparison",
                  "Custom date range filtering",
                  "Export to CSV / PDF",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-[var(--color-on-dark-soft)]"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl shadow-black/40">
                <Image
                  src="/images/analytics-preview.jpg"
                  alt="Komet Analytics"
                  width={1200}
                  height={800}
                  className="w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -left-1 -right-1 h-1/2 bg-gradient-to-t from-[var(--color-surface-dark)] to-transparent pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="border-t border-white/[0.06] px-6 py-24" id="pricing">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="mt-4 font-display text-4xl font-bold text-[var(--color-on-dark)]">
              {t("pricingTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">
              {t("pricingSubtitle")}
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {planKeys.map((planId, i) => {
              const popular = planPopular[planId];
              const planKey =
                planId === "free"
                  ? "planFree"
                  : planId === "creator"
                    ? "planCreator"
                    : planId === "pro"
                      ? "planPro"
                      : "planBusiness";
              const features = t.raw(`${planKey}Features`) as string[];
              return (
                <motion.div
                  key={planId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className={`relative rounded-2xl border p-6 ${
                    popular
                      ? "border-[var(--color-primary)]/50 bg-gradient-to-b from-[var(--color-primary)]/[0.08] to-transparent"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  {popular && (
                    <>
                      <div className="absolute inset-x-0 -top-px mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent" />
                      <span className="mb-3 inline-block rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-[11px] font-semibold text-[var(--color-on-primary)]">
                        {t("mostPopular")}
                      </span>
                    </>
                  )}
                  <h3 className="text-lg font-semibold text-[var(--color-on-dark)]">
                    {t(planKey)}
                  </h3>
                  <p className="mt-1 flex items-baseline gap-0.5">
                    <span className="font-display text-3xl font-bold text-[var(--color-on-dark)]">
                      {t(`${planKey}Price`)}
                    </span>
                    <span className="text-sm text-[var(--color-on-dark-muted)]">
                      {t("perMonth")}
                    </span>
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {features.map((feature: string) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-[var(--color-on-dark-soft)]"
                      >
                        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-8 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all ${
                      popular
                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-lg shadow-[var(--color-primary)]/20"
                        : "border border-white/10 text-[var(--color-on-dark-soft)] hover:bg-white/[0.04] hover:text-[var(--color-on-dark)]"
                    }`}
                  >
                    {t("getStarted")}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[var(--color-primary)]/[0.08] via-purple-600/[0.04] to-transparent p-12 text-center"
          >
            {/* Glow */}
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/15 blur-[100px]" />

            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-[var(--color-on-dark)] sm:text-4xl">
                Ready to streamline your social media?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[var(--color-on-dark-soft)]">
                Join thousands of creators and teams who trust Komet to manage their content
                across every platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3 text-base font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/25"
                >
                  {t("startFree")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-[var(--color-on-dark-muted)]">
                No credit card required. Free forever plan available.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-[var(--color-on-dark)]">Komet</span>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-[var(--color-on-dark-muted)]">
              &copy; {new Date().getFullYear()} Komet. {t("allRightsReserved")}
            </span>
            <Link
              href="/privacy"
              className="text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              Privacy
            </Link>
          </div>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              {t("startFree")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
