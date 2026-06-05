"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Sparkles, Calendar, Share2, BarChart3, Bot, Globe } from "lucide-react";
import { HeaderLanguageSwitcher } from "@/components/layout/header-language-switcher";

export default function LandingPage() {
  const t = useTranslations("landing");

  const platforms = [
    { id: "twitter" as const, label: "Twitter / X" },
    { id: "instagram" as const, label: "Instagram" },
    { id: "facebook" as const, label: "Facebook" },
    { id: "youtube" as const, label: "YouTube" },
    { id: "linkedin" as const, label: "LinkedIn" },
    { id: "threads" as const, label: "Threads" },
    { id: "tiktok" as const, label: "TikTok" },
    { id: "pinterest" as const, label: "Pinterest" },
    { id: "reddit" as const, label: "Reddit" },
    { id: "bluesky" as const, label: "Bluesky" },
    { id: "telegram" as const, label: "Telegram" },
    { id: "discord" as const, label: "Discord" },
    { id: "snapchat" as const, label: "Snapchat" },
    { id: "googlebusiness" as const, label: "Google Business" },
    { id: "whatsapp" as const, label: "WhatsApp" },
  ];

  const featureKeys = [
    { key: "visualCalendar", icon: Calendar },
    { key: "multiPlatform", icon: Share2 },
    { key: "advancedAnalytics", icon: BarChart3 },
    { key: "aiGenerator", icon: Bot },
    { key: "unifiedInbox", icon: Globe },
    { key: "smartQueue", icon: Sparkles },
  ];

  const planKeys = ["free", "creator", "pro", "business"];
  const planPopular: Record<string, boolean> = {
    free: false,
    creator: true,
    pro: false,
    business: false,
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
            <span className="font-display text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
          </div>
          <div className="flex items-center gap-3">
            <HeaderLanguageSwitcher />
            <Link href="/login" className="text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors">
              {t("login")}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              {t("startFree")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="font-display text-display-xl font-bold text-[var(--color-on-dark)]">
            {t("heroTitle")}{" "}
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              {t("heroEmphasis")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-[var(--color-on-dark-soft)]">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-[var(--color-primary)] px-8 py-3 text-button-lg font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-glow"
            >
              {t("startFree")}
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-[var(--color-ink-muted)] px-8 py-3 text-button-lg font-semibold text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
            >
              {t("signIn")}
            </Link>
          </div>

          {/* Platform badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
            {platforms.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-raised)] px-3 py-1 text-caption text-[var(--color-on-dark-soft)]"
              >
                <PlatformIcon platform={p.id} className="h-3.5 w-3.5" />
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--color-ink-muted)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-display-lg font-bold text-[var(--color-on-dark)]">
            {t("featuresTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-body-md text-[var(--color-on-dark-soft)]">
            {t("featuresSubtitle")}
          </p>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureKeys.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.key}
                  className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 hover:border-[var(--color-primary)]/50 transition-colors"
                >
                  <Icon className="h-8 w-8 text-[var(--color-primary)]" />
                  <h3 className="mt-4 font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                    {t(`${f.key}`)}
                  </h3>
                  <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">{t(`${f.key}Desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-[var(--color-ink-muted)] px-6 py-24" id="pricing">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-display-lg font-bold text-[var(--color-on-dark)]">
            {t("pricingTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-body-md text-[var(--color-on-dark-soft)]">
            {t("pricingSubtitle")}
          </p>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {planKeys.map((planId) => {
              const popular = planPopular[planId];
              const planKey = planId === "free" ? "planFree" : planId === "creator" ? "planCreator" : planId === "pro" ? "planPro" : "planBusiness";
              const features = t.raw(`${planKey}Features`) as string[];
              return (
                <div
                  key={planId}
                  className={`rounded-xl border p-6 ${
                    popular
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]"
                  }`}
                >
                  {popular && (
                    <span className="mb-3 inline-block rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-caption-uppercase text-[var(--color-on-primary)]">
                      {t("mostPopular")}
                    </span>
                  )}
                  <h3 className="font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
                    {t(planKey)}
                  </h3>
                  <p className="mt-2 font-display text-display-lg font-bold text-[var(--color-on-dark)]">
                    {t(`${planKey}Price`)}
                    <span className="text-body-sm text-[var(--color-on-dark-muted)]">{t("perMonth")}</span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {features.map((feature: string) => (
                      <li key={feature} className="flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-8 flex w-full items-center justify-center rounded-lg py-2.5 text-button font-semibold transition-colors ${
                      popular
                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                        : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                    }`}
                  >
                    {t("getStarted")}
                  </Link>
                </div>
              );
            })}
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
            &copy; {new Date().getFullYear()} Komet. {t("allRightsReserved")}
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-caption text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
              {t("login")}
            </Link>
            <Link href="/register" className="text-caption text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
              {t("startFree")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
