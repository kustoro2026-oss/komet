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
  Layers,
  Shield,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { HeaderLanguageSwitcher } from "@/components/layout/header-language-switcher";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Platform } from "@komet/shared";

export default function LandingPage() {
  const t = useTranslations("landing");

  const platforms: { id: Platform; label: string; color: string }[] = [
    { id: "twitter", label: "Twitter / X", color: "#1DA1F2" },
    { id: "instagram", label: "Instagram", color: "#E4405F" },
    { id: "facebook", label: "Facebook", color: "#1877F2" },
    { id: "youtube", label: "YouTube", color: "#FF0000" },
    { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
    { id: "threads", label: "Threads", color: "#000000" },
    { id: "tiktok", label: "TikTok", color: "#000000" },
    { id: "pinterest", label: "Pinterest", color: "#E60023" },
    { id: "reddit", label: "Reddit", color: "#FF4500" },
    { id: "bluesky", label: "Bluesky", color: "#0285FF" },
    { id: "telegram", label: "Telegram", color: "#26A5E4" },
    { id: "discord", label: "Discord", color: "#5865F2" },
    { id: "snapchat", label: "Snapchat", color: "#FFFC00" },
    { id: "googlebusiness", label: "Google Business", color: "#4285F4" },
    { id: "whatsapp", label: "WhatsApp", color: "#25D366" },
  ];

  const doubledPlatforms = [...platforms, ...platforms, ...platforms];

  const featureKeys = [
    { key: "visualCalendar", icon: Calendar, gradient: "from-violet-500 to-purple-500" },
    { key: "multiPlatform", icon: Share2, gradient: "from-blue-500 to-cyan-500" },
    { key: "advancedAnalytics", icon: BarChart3, gradient: "from-emerald-500 to-teal-500" },
    { key: "aiGenerator", icon: Bot, gradient: "from-orange-500 to-pink-500" },
    { key: "unifiedInbox", icon: MessageCircle, gradient: "from-rose-500 to-red-500" },
    { key: "smartQueue", icon: Zap, gradient: "from-amber-500 to-yellow-500" },
  ];

  const planKeys = ["free", "creator", "pro", "business"];
  const planPopular: Record<string, boolean> = {
    free: false,
    creator: true,
    pro: false,
    business: false,
  };

  const stats = [
    { value: "15+", label: "Platforms" },
    { value: "10K+", label: "Posts Scheduled" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9", label: "User Rating", icon: Star },
  ];

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* === HEADER === */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-white">Komet</span>
          </Link>
          <div className="flex items-center gap-4">
            <HeaderLanguageSwitcher />
            <Link
              href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-600/25"
            >
              {t("startFree")}
            </Link>
          </div>
        </div>
      </header>

      {/* === HERO === */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-purple-600/15 blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[80px]" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-24 pb-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            {/* Badge */}
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              Now supporting 15+ platforms
            </div>

            <h1 className="font-display text-5xl font-bold leading-tight text-white sm:text-6xl md:text-7xl">
              {t("heroTitle")}{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t("heroEmphasis")}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50 leading-relaxed">
              {t("heroSubtitle")}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3.5 text-base font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-600/30 hover:shadow-violet-500/40"
              >
                {t("startFree")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-semibold text-white/80 hover:bg-white/5 hover:text-white transition-all"
              >
                {t("signIn")}
              </Link>
            </motion.div>
          </motion.div>

          {/* Dashboard preview image */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative mt-16 w-full max-w-5xl"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-violet-600/10">
              <Image
                src="/images/dashboard-preview.jpg"
                alt="Komet Dashboard Preview"
                width={1200}
                height={675}
                className="w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
            </div>
            {/* Glow */}
            <div className="absolute -bottom-20 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[80px]" />
          </motion.div>
        </motion.div>
      </section>

      {/* === PLATFORMS SCROLLING BAR === */}
      <section className="relative border-t border-white/5 py-12 overflow-hidden">
        <div className="mx-auto mb-8 max-w-7xl px-6">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-white/30">
            Connect all your platforms
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 z-10 w-20 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 z-10 w-20 bg-gradient-to-l from-[#0a0a0f] to-transparent" />
          <motion.div
            className="flex gap-4"
            animate={{ x: ["0%", "-33.33%"] }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {doubledPlatforms.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="flex shrink-0 items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-3"
              >
                <PlatformIcon platform={p.id} className="h-5 w-5" />
                <span className="whitespace-nowrap text-sm text-white/60">{p.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === STATS === */}
      <section className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center"
              >
                {stat.icon && (
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Star className="h-5 w-5 text-amber-400" />
                  </div>
                )}
                <p className="font-display text-4xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-white/40">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="border-t border-white/5 px-6 py-24" id="features">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-white/60">
              Features
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold text-white">
              {t("featuresTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              {t("featuresSubtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {featureKeys.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.key}
                  variants={itemVariants}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-violet-500/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div
                    className={`relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="relative z-10 font-display text-lg font-semibold text-white">
                    {t(`${f.key}`)}
                  </h3>
                  <p className="relative z-10 mt-2 text-sm text-white/40 leading-relaxed">
                    {t(`${f.key}Desc`)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* === ANALYTICS PREVIEW === */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-white/60">
                Analytics
              </span>
              <h2 className="mt-4 font-display text-4xl font-bold text-white">
                Measure what matters
              </h2>
              <p className="mt-4 text-white/50 leading-relaxed">
                Track engagement, follower growth, and top-performing content across all your platforms in one unified dashboard. Beautiful charts, exportable reports.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Real-time engagement metrics",
                  "Cross-platform comparison",
                  "Custom date range analytics",
                  "Export to CSV/PDF",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-xl">
                <Image
                  src="/images/analytics-preview.jpg"
                  alt="Analytics Dashboard"
                  width={1200}
                  height={800}
                  className="w-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === PRICING === */}
      <section className="border-t border-white/5 px-6 py-24" id="pricing">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-white/60">
              Pricing
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold text-white">
              {t("pricingTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              {t("pricingSubtitle")}
            </p>
          </motion.div>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative rounded-2xl border p-6 ${
                    popular
                      ? "border-violet-500/50 bg-gradient-to-b from-violet-600/10 to-transparent"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  {/* Glow for popular */}
                  {popular && (
                    <div className="absolute -top-0.5 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
                  )}
                  {popular && (
                    <span className="mb-3 inline-block rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-0.5 text-xs font-semibold text-white">
                      {t("mostPopular")}
                    </span>
                  )}
                  <h3 className="font-display text-xl font-bold text-white">{t(planKey)}</h3>
                  <p className="mt-2 font-display text-4xl font-bold text-white">
                    {t(`${planKey}Price`)}
                    <span className="text-sm font-normal text-white/40">{t("perMonth")}</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {features.map((feature: string) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-white/50"
                      >
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-8 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${
                      popular
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/25"
                        : "border border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
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

      {/* === CTA === */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-transparent p-12 text-center"
          >
            {/* Glow */}
            <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-bold text-white">
                Ready to streamline your social media?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/50">
                Join thousands of creators and teams who trust Komet to manage their content across every platform.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3.5 text-base font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-600/30"
                >
                  {t("startFree")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/30">No credit card required. Free forever plan available.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-display text-base font-bold text-white">Komet</span>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-white/30">
              &copy; {new Date().getFullYear()} Komet. {t("allRightsReserved")}
            </span>
            <Link href="/privacy" className="text-white/40 hover:text-white/60 transition-colors">
              Privacy
            </Link>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              {t("startFree")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
