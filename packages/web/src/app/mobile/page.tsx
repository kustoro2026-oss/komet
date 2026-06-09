"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Smartphone,
  Download,
  Zap,
  Bell,
  Wifi,
  Share2,
  Monitor,
  Star,
} from "lucide-react";
import { KometLogoIcon } from "@/components/ui/komet-logo";
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function MobileAppPage() {
  const t = useTranslations("mobile");

  const featureIcons = [Zap, Bell, Wifi, Share2, Monitor, Smartphone];
  const features = t.raw("features.items") as unknown as { title: string; desc: string }[];

  const stepIcons = [Download, Share2, KometLogoIcon];
  const steps = t.raw("install.steps") as unknown as { title: string; desc: string }[];

  const stats = [
    { value: "100%", label: t("stats.webBased") },
    { value: "0", label: t("stats.appStoreHassle") },
    { value: "< 2MB", label: t("stats.installSize") },
    { value: "All OS", label: t("stats.crossPlatform") },
  ];

  const checkmarks = t.raw("hero.checkmarks") as unknown as string[];

  const comparisonRows = t.raw("comparison.rows") as unknown as { feature: string; pwa: string; native: string }[];

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[var(--color-surface-dark)]/70 backdrop-blur-2xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <KometLogo size="sm" className="h-8 w-8 rounded-lg shadow-md shadow-[var(--color-primary)]/25" />
            <span className="text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("nav.signIn")}</Link>
            <Link href="/register" className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all">{t("nav.getStarted")}</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/3 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[var(--color-primary)]/8 blur-[140px]" />
          <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-400/80">{t("badge")}</span>
              </div>

              <h1 className="font-display text-4xl font-bold text-[var(--color-on-dark)] sm:text-5xl lg:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="mt-4 text-lg text-[var(--color-on-dark-soft)] leading-relaxed">
                {t("hero.subtitle")}
              </p>

              <div className="mt-8 space-y-3">
                {checkmarks.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-[var(--color-on-dark-soft)]">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#how-to-install"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/25"
                >
                  <Download className="h-4 w-4" />
                  {t("installNow")}
                </a>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-[var(--color-on-dark-soft)] hover:bg-white/[0.04] hover:text-[var(--color-on-dark)] transition-all"
                >
                  {t("createFreeAccount")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
              <div className="relative mx-auto aspect-[9/19] max-w-[280px] rounded-[2.5rem] border-4 border-white/10 bg-black p-2 shadow-2xl shadow-black/50">
                <div className="h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#1a1a2e] to-[#0c0c13]">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                    <KometLogo size="sm" className="h-7 w-7 rounded-lg" />
                    <span className="text-xs font-semibold text-white">Komet</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <div className="h-2 w-24 rounded bg-white/10" />
                      <div className="mt-2 h-2 w-32 rounded bg-white/10" />
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <div className="h-2 w-28 rounded bg-white/10" />
                      <div className="mt-2 h-2 w-36 rounded bg-white/10" />
                    </div>
                    <div className="rounded-lg bg-gradient-to-r from-[var(--color-primary)]/20 to-transparent p-3">
                      <div className="h-2 w-20 rounded bg-white/20" />
                      <div className="mt-2 h-2 w-40 rounded bg-white/20" />
                    </div>
                    <div className="rounded-lg bg-white/[0.04] p-3">
                      <div className="h-2 w-32 rounded bg-white/10" />
                      <div className="mt-2 h-2 w-24 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow behind phone */}
              <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary)]/15 blur-[80px]" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
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
                <p className="font-display text-3xl font-bold text-[var(--color-on-dark)]">{stat.value}</p>
                <p className="mt-1.5 text-sm text-[var(--color-on-dark-muted)]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-medium tracking-wide text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              {t("features.heading")}
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold text-[var(--color-on-dark)]">{t("features.title")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">
              {t("features.subtitle")}
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <motion.div key={f.title} variants={fadeUp} custom={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-purple-600 shadow-md shadow-[var(--color-primary)]/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--color-on-dark)]">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How to Install */}
      <section className="border-t border-white/[0.06] px-6 py-20" id="how-to-install">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-medium tracking-wide text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              {t("install.heading")}
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold text-[var(--color-on-dark)]">{t("install.title")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">
              {t("install.subtitle")}
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <motion.div key={step.title} variants={fadeUp} custom={i} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center transition-all duration-300 hover:border-white/10">
                  <span className="font-display absolute right-5 top-4 select-none text-5xl font-bold leading-none text-white/[0.04]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative z-10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 shadow-lg shadow-[var(--color-primary)]/20">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="relative z-10 text-lg font-semibold text-[var(--color-on-dark)]">{step.title}</h3>
                  <p className="relative z-10 mt-2 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Browser icons */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-center">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
              <p className="text-sm font-medium text-[var(--color-on-dark)]">{t("install.browserIos")}</p>
              <p className="mt-0.5 text-xs text-[var(--color-on-dark-muted)]">{t("install.browserIosDesc")}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
              <p className="text-sm font-medium text-[var(--color-on-dark)]">{t("install.browserAndroid")}</p>
              <p className="mt-0.5 text-xs text-[var(--color-on-dark-muted)]">{t("install.browserAndroidDesc")}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
              <p className="text-sm font-medium text-[var(--color-on-dark)]">{t("install.browserDesktop")}</p>
              <p className="mt-0.5 text-xs text-[var(--color-on-dark-muted)]">{t("install.browserDesktopDesc")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-white/[0.06] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="font-display text-3xl font-bold text-[var(--color-on-dark)]">{t("comparison.title")}</h2>
            <p className="mt-3 text-[var(--color-on-dark-soft)]">
              {t("comparison.subtitle")}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="p-4 text-left font-semibold text-[var(--color-on-dark)]">{t("comparison.feature")}</th>
                  <th className="p-4 text-center font-semibold text-[var(--color-on-dark)]">
                    <span className="inline-flex items-center gap-1.5 text-[var(--color-primary)]">
                      <KometLogo size="sm" /> {t("comparison.kometPwa")}
                    </span>
                  </th>
                  <th className="p-4 text-center font-semibold text-[var(--color-on-dark-muted)]">{t("comparison.nativeApp")}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={i < comparisonRows.length - 1 ? "border-b border-white/[0.06]" : ""}>
                    <td className="p-4 text-[var(--color-on-dark-soft)]">{row.feature}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <CheckCircle className="h-3.5 w-3.5" /> {row.pwa}
                      </span>
                    </td>
                    <td className="p-4 text-center text-[var(--color-on-dark-muted)]">{row.native}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[var(--color-primary)]/[0.08] via-purple-600/[0.04] to-transparent p-6 sm:p-12 text-center"
          >
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/15 blur-[100px]" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 shadow-lg shadow-[var(--color-primary)]/20">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-[var(--color-on-dark)] sm:text-4xl">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[var(--color-on-dark-soft)]">
                {t("cta.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3 text-base font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/25"
                >
                  <Star className="h-4 w-4" />
                  {t("cta.button")}
                </Link>
              </div>
              <p className="mt-4 text-xs text-[var(--color-on-dark-muted)]">
                {t("cta.disclaimer")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <KometLogo size="sm" className="h-7 w-7 rounded-lg" />
            <span className="font-bold text-[var(--color-on-dark)]">Komet</span>
          </Link>
          <div className="flex gap-6 text-sm">
            <span className="text-[var(--color-on-dark-muted)]">{t("footer.copyright", { year: new Date().getFullYear() })}</span>
            <Link href="/privacy" className="text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footer.privacy")}</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footer.home")}</Link>
            <Link href="/login" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">{t("footer.signIn")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
