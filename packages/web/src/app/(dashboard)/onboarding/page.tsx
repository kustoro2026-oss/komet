"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import type { OnboardingStep } from "@/components/onboarding-checklist";
import { KometLogoIcon } from "@/components/ui/komet-logo";
import { KometLogo } from "@/components/ui/komet-logo";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const [steps, setSteps] = useState<OnboardingStep[]>(() => [
    { id: "connect", title: t("stepConnectTitle"), description: t("stepConnectDesc"), icon: KometLogoIcon, href: "/accounts/connect", isComplete: false },
    { id: "first_post", title: t("stepFirstPostTitle"), description: t("stepFirstPostDesc"), icon: KometLogoIcon, href: "/posts/create", isComplete: false },
    { id: "profile", title: t("stepProfileTitle"), description: t("stepProfileDesc"), icon: KometLogoIcon, href: "/settings", isComplete: false },
    { id: "invite_team", title: t("stepInviteTitle"), description: t("stepInviteDesc"), icon: KometLogoIcon, href: "/team", isComplete: false },
    { id: "explore_ai", title: t("stepExploreAiTitle"), description: t("stepExploreAiDesc"), icon: KometLogoIcon, href: "/ai", isComplete: false },
    { id: "media_upload", title: t("stepMediaTitle"), description: t("stepMediaDesc"), icon: KometLogoIcon, href: "/media", isComplete: false },
  ]);

  const completedCount = steps.filter((s) => s.isComplete).length;
  const isAllComplete = completedCount === steps.length;

  const stats = useMemo(() => [
    { label: t("totalSteps"), value: steps.length, color: "text-[var(--color-on-dark)]" },
    { label: t("completed"), value: completedCount, color: "text-[var(--color-success)]" },
    { label: t("remaining"), value: steps.length - completedCount, color: "text-[var(--color-warning)]" },
  ], [t, steps.length, completedCount]);

  const helpCards = useMemo(() => [
    { title: t("helpDocsTitle"), description: t("helpDocsDesc"), href: "#" },
    { title: t("helpVideosTitle"), description: t("helpVideosDesc"), href: "#" },
    { title: t("helpForumTitle"), description: t("helpForumDesc"), href: "#" },
    { title: t("helpSupportTitle"), description: t("helpSupportDesc"), href: "#" },
  ], [t]);

  const handleComplete = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, isComplete: !s.isComplete } : s))
    );
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-caption font-medium text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("backToDashboard")}
      </Link>

      {/* Welcome Header */}
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] mb-6">
          {isAllComplete ? (
            <CheckCircle className="h-8 w-8 text-white" />
          ) : (
            <KometLogo size="lg" />
          )}
        </div>
        <h1 className="font-display text-4xl font-bold text-[var(--color-on-dark)]">
          {isAllComplete ? t("welcomeTitle") : t("letsGetStarted")}
        </h1>
        <p className="mt-3 text-body-lg text-[var(--color-on-dark-soft)] max-w-xl mx-auto">
          {isAllComplete
            ? t("completionMessage")
            : t("incompleteMessage")}
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4 text-center"
          >
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{stat.label}</p>
            <p className={`mt-1 font-display text-heading-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <OnboardingChecklist steps={steps} onComplete={handleComplete} />

      {/* Help Section */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)] mb-4">
          {t("needHelp")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {helpCards.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="rounded-lg border border-[var(--color-ink-muted)] p-4 hover:border-[var(--color-ink-soft)] transition-all hover:bg-[var(--color-surface-dark)]"
            >
              <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">{item.title}</p>
              <p className="mt-0.5 text-micro text-[var(--color-on-dark-soft)]">{item.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
