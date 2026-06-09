"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronRight, Calendar, Users, Bell, Image, Link as LinkIcon } from "lucide-react";
import NextLink from "next/link";
import { KometLogoIcon } from "@/components/ui/komet-logo";
import { KometLogo } from "@/components/ui/komet-logo";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isComplete: boolean;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  onComplete?: (stepId: string) => void;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  { id: "connect", title: "Connect Social Accounts", description: "Link your social media platforms", icon: LinkIcon, href: "/accounts/connect", isComplete: false },
  { id: "first_post", title: "Create Your First Post", description: "Write and schedule your first content", icon: Calendar, href: "/posts/create", isComplete: false },
  { id: "invite_team", title: "Invite Team Members", description: "Collaborate with your team", icon: Users, href: "/team", isComplete: false },
  { id: "setup_ai", title: "Explore AI Features", description: "Try AI content generation", icon: KometLogoIcon, href: "/ai", isComplete: false },
  { id: "upload_media", title: "Upload Media", description: "Add images and videos to your library", icon: Image, href: "/media", isComplete: false },
  { id: "notifications", title: "Configure Notifications", description: "Set up your notification preferences", icon: Bell, href: "/settings", isComplete: false },
];

export function OnboardingChecklist({ steps: initialSteps, onComplete }: OnboardingChecklistProps) {
  const tc = useTranslations("common");
  const [steps, setSteps] = useState(initialSteps.length > 0 ? initialSteps : DEFAULT_STEPS);

  const completedCount = steps.filter((s) => s.isComplete).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isAllComplete = completedCount === totalCount;

  const handleComplete = (stepId: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, isComplete: !s.isComplete } : s))
    );
    onComplete?.(stepId);
  };

  return (
    <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]">
            <KometLogo size="md" />
          </div>
          <div>
            <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
              {isAllComplete ? tc("onboarding_allDone") : tc("onboarding_gettingStarted")}
            </h3>
            <p className="text-micro text-[var(--color-on-dark-soft)]">
              {isAllComplete
                ? tc("onboarding_completedAll")
                : tc("onboarding_stepsCompleted", { completed: completedCount, total: totalCount })}
            </p>
          </div>
        </div>
        {isAllComplete && (
          <NextLink
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            {tc("onboarding_goToDashboard")}
            <ChevronRight className="h-4 w-4" />
          </NextLink>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6 h-2 w-full rounded-full bg-[var(--color-surface-dark)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`group flex items-center gap-4 rounded-lg border p-4 transition-all ${
              step.isComplete
                ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/5"
                : "border-[var(--color-ink-muted)] hover:border-[var(--color-ink-soft)]"
            }`}
          >
            {/* Step Number / Check */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-caption font-bold transition-all ${
                step.isComplete
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-surface-dark)] text-[var(--color-on-dark-muted)]"
              }`}
            >
              {step.isComplete ? <Check className="h-4 w-4" /> : index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className={`text-body-sm font-semibold ${step.isComplete ? "text-[var(--color-success)]" : "text-[var(--color-on-dark)]"}`}>
                {tc(`onboarding_${step.id}` as any) || step.title}
              </h4>
              <p className="text-micro text-[var(--color-on-dark-muted)]">
                {tc(`onboarding_${step.id}_desc` as any) || step.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleComplete(step.id)}
                className={`rounded-lg px-3 py-1.5 text-micro font-medium transition-all ${
                  step.isComplete
                    ? "text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark-soft)]"
                    : "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/20"
                }`}
              >
                {step.isComplete ? tc("onboarding_undo") : tc("onboarding_markDone")}
              </button>
              <NextLink
                href={step.href}
                className="flex items-center gap-1 rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-micro font-medium text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)] transition-all"
              >
                {tc("onboarding_go")}
                <ChevronRight className="h-3 w-3" />
              </NextLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
