"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
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
  const features = [
    {
      icon: Zap,
      title: "Blazing Fast",
      desc: "Native app-like performance. Navigate between calendar, posts, and analytics instantly.",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      desc: "Get notified when posts publish, comments arrive, or tokens are about to expire.",
    },
    {
      icon: Wifi,
      title: "Offline Access",
      desc: "Browse your content calendar and draft posts even without internet connection.",
    },
    {
      icon: Share2,
      title: "Quick Share",
      desc: "Share content directly from your phone browser or gallery to Komet in one tap.",
    },
    {
      icon: Monitor,
      title: "Seamless Sync",
      desc: "All your data syncs instantly between desktop and mobile. Pick up where you left off.",
    },
    {
      icon: Smartphone,
      title: "Home Screen Ready",
      desc: "Add to your home screen and use it like any other app. No app store needed.",
    },
  ];

  const steps = [
    {
      icon: Download,
      title: "Open in Browser",
      desc: "Visit app.komet.com on your phone using Chrome, Safari, or Edge.",
    },
    {
      icon: Share2,
      title: "Add to Home Screen",
      desc: "Tap the share button (iOS) or the install prompt (Android) and select Add to Home Screen.",
    },
    {
      icon: Sparkles,
      title: "Start Scheduling",
      desc: "Launch Komet from your home screen and manage your content like a native app.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[var(--color-surface-dark)]/70 backdrop-blur-2xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-purple-600 shadow-md shadow-[var(--color-primary)]/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">Sign In</Link>
            <Link href="/register" className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all">Get Started</Link>
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
                <span className="text-xs font-medium text-emerald-400/80">PWA — No app store needed</span>
              </div>

              <h1 className="font-display text-4xl font-bold text-[var(--color-on-dark)] sm:text-5xl lg:text-6xl">
                Komet on{" "}
                <span className="bg-gradient-to-r from-[var(--color-primary)] via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Mobile
                </span>
              </h1>
              <p className="mt-4 text-lg text-[var(--color-on-dark-soft)] leading-relaxed">
                Take your social media management on the go. Schedule posts, track analytics, and manage your inbox — all from your phone. Install as a Progressive Web App for a native-like experience.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Works on iOS, Android, and any modern browser",
                  "Full dashboard with calendar and analytics",
                  "Push notifications for publishing and engagement",
                  "Automatic sync between desktop and mobile",
                ].map((item) => (
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
                  Install Now
                </a>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-[var(--color-on-dark-soft)] hover:bg-white/[0.04] hover:text-[var(--color-on-dark)] transition-all"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
              <div className="relative mx-auto aspect-[9/19] max-w-[280px] rounded-[2.5rem] border-4 border-white/10 bg-black p-2 shadow-2xl shadow-black/50">
                <div className="h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#1a1a2e] to-[#0c0c13]">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-purple-600">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
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
            {[
              { value: "100%", label: "Web-Based" },
              { value: "0", label: "App Store Hassle" },
              { value: "< 2MB", label: "Install Size" },
              { value: "All OS", label: "Cross-Platform" },
            ].map((stat, i) => (
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
              Mobile Features
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold text-[var(--color-on-dark)]">Everything you love, now on mobile</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">
              Full-featured mobile experience with zero compromises.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
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
              Installation Guide
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold text-[var(--color-on-dark)]">Install in 3 simple steps</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--color-on-dark-soft)]">
              No app store, no downloads. Just a simple add to your home screen.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
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
              <p className="text-sm font-medium text-[var(--color-on-dark)]">iOS (Safari)</p>
              <p className="mt-0.5 text-xs text-[var(--color-on-dark-muted)]">Tap Share → Add to Home Screen</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
              <p className="text-sm font-medium text-[var(--color-on-dark)]">Android (Chrome)</p>
              <p className="mt-0.5 text-xs text-[var(--color-on-dark-muted)]">Tap Install prompt or menu → Install App</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
              <p className="text-sm font-medium text-[var(--color-on-dark)]">Desktop (Chrome/Edge)</p>
              <p className="mt-0.5 text-xs text-[var(--color-on-dark-muted)]">Click Install icon in address bar</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-white/[0.06] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="font-display text-3xl font-bold text-[var(--color-on-dark)]">PWA vs Native App</h2>
            <p className="mt-3 text-[var(--color-on-dark-soft)]">
              Why we chose PWA over a native mobile app.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10 overflow-hidden rounded-2xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="p-4 text-left font-semibold text-[var(--color-on-dark)]">Feature</th>
                  <th className="p-4 text-center font-semibold text-[var(--color-on-dark)]">
                    <span className="inline-flex items-center gap-1.5 text-[var(--color-primary)]">
                      <Sparkles className="h-3.5 w-3.5" /> Komet PWA
                    </span>
                  </th>
                  <th className="p-4 text-center font-semibold text-[var(--color-on-dark-muted)]">Native App</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Install size", pwa: "< 2MB", native: "50-200MB" },
                  { feature: "Updates", pwa: "Instant — no app store", native: "App store review required" },
                  { feature: "Cross-platform", pwa: "iOS, Android, Desktop", native: "Separate builds per OS" },
                  { feature: "Offline support", pwa: "Yes", native: "Yes" },
                  { feature: "Push notifications", pwa: "Yes", native: "Yes" },
                  { feature: "No downloads required", pwa: "Yes", native: "No" },
                ].map((row, i) => (
                  <tr key={row.feature} className={i < 5 ? "border-b border-white/[0.06]" : ""}>
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
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[var(--color-primary)]/[0.08] via-purple-600/[0.04] to-transparent p-12 text-center"
          >
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--color-primary)]/15 blur-[100px]" />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 shadow-lg shadow-[var(--color-primary)]/20">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-[var(--color-on-dark)] sm:text-4xl">
                Ready to manage content on the go?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[var(--color-on-dark-soft)]">
                Open Komet on your phone, install instantly, and start scheduling posts from anywhere.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3 text-base font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/25"
                >
                  <Star className="h-4 w-4" />
                  Get Started Free
                </Link>
              </div>
              <p className="mt-4 text-xs text-[var(--color-on-dark-muted)]">
                No credit card required. Open on your phone to install.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-purple-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-[var(--color-on-dark)]">Komet</span>
          </Link>
          <div className="flex gap-6 text-sm">
            <span className="text-[var(--color-on-dark-muted)]">&copy; {new Date().getFullYear()} Komet. All rights reserved.</span>
            <Link href="/privacy" className="text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">Privacy</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">Home</Link>
            <Link href="/login" className="text-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
