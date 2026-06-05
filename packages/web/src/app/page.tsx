import Link from "next/link";
import { Sparkles, Calendar, Share2, BarChart3, Bot, Globe } from "lucide-react";

export default function LandingPage() {
  const platforms = [
    "Twitter / X", "Instagram", "Facebook", "YouTube", "LinkedIn",
    "Threads", "TikTok", "Pinterest", "Reddit", "Bluesky",
    "Telegram", "Discord", "Snapchat", "Google Business", "WhatsApp",
  ];

  const features = [
    {
      icon: Calendar,
      title: "Visual Calendar",
      desc: "Drag & drop scheduling with monthly/weekly views across all platforms.",
    },
    {
      icon: Share2,
      title: "Multi-Platform Publishing",
      desc: "Publish to 15+ social platforms simultaneously with per-platform customization.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      desc: "Track engagement, growth, and top-performing posts with beautiful charts.",
    },
    {
      icon: Bot,
      title: "AI Content Generator",
      desc: "Generate captions, hashtags, threads, and replies powered by GPT-4o.",
    },
    {
      icon: Globe,
      title: "Unified Inbox",
      desc: "Manage comments, messages, and reviews from all platforms in one place.",
    },
    {
      icon: Sparkles,
      title: "Smart Queue",
      desc: "AI-powered scheduling that finds the best times to post for maximum engagement.",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      features: ["1 workspace", "3 social accounts", "10 scheduled posts", "Basic analytics"],
    },
    {
      name: "Creator",
      price: "$9",
      features: ["3 workspaces", "10 social accounts", "Unlimited posts", "AI content generation", "Analytics export"],
      popular: true,
    },
    {
      name: "Pro",
      price: "$39",
      features: ["10 workspaces", "25 social accounts", "Team collaboration", "Auto-reply rules", "Custom reports", "Priority support"],
    },
    {
      name: "Business",
      price: "$99",
      features: ["Unlimited workspaces", "Unlimited accounts", "API access", "MCP server", "White-label options", "Dedicated support"],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
            <span className="font-display text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="font-display text-display-xl font-bold text-[var(--color-on-dark)]">
            Blast Your Content to{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              Every Platform
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-[var(--color-on-dark-soft)]">
            Schedule, publish, and analyze content across 15+ social media platforms.
            Built for creators, teams, and developers. All from one powerful dashboard.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-[var(--color-primary)] px-8 py-3 text-button-lg font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-glow"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-[var(--color-ink-muted)] px-8 py-3 text-button-lg font-semibold text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Platform badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-raised)] px-3 py-1 text-caption text-[var(--color-on-dark-soft)]"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--color-ink-muted)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-display-lg font-bold text-[var(--color-on-dark)]">
            Everything You Need
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-body-md text-[var(--color-on-dark-soft)]">
            Powerful features to manage your entire social media presence
          </p>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 hover:border-[var(--color-primary)]/50 transition-colors"
              >
                <f.icon className="h-8 w-8 text-[var(--color-primary)]" />
                <h3 className="mt-4 font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-[var(--color-ink-muted)] px-6 py-24" id="pricing">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-display-lg font-bold text-[var(--color-on-dark)]">
            Simple Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-body-md text-[var(--color-on-dark-soft)]">
            Choose the plan that fits your needs
          </p>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.popular
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]"
                }`}
              >
                {plan.popular && (
                  <span className="mb-3 inline-block rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-caption-uppercase text-[var(--color-on-primary)]">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
                  {plan.name}
                </h3>
                <p className="mt-2 font-display text-display-lg font-bold text-[var(--color-on-dark)]">
                  {plan.price}
                  <span className="text-body-sm text-[var(--color-on-dark-muted)]">/mo</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 flex w-full items-center justify-center rounded-lg py-2.5 text-button font-semibold transition-colors ${
                    plan.popular
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                      : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-ink-muted)] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
            <span className="font-display text-base font-bold text-[var(--color-on-dark)]">Komet</span>
          </div>
          <p className="text-caption text-[var(--color-on-dark-muted)]">
            &copy; {new Date().getFullYear()} Komet. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-caption text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
              Login
            </Link>
            <Link href="/register" className="text-caption text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
