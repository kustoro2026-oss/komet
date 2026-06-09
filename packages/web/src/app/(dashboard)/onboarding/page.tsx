"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import type { OnboardingStep } from "@/components/onboarding-checklist";

const KometLogoImg = ({ className }: { className?: string }) => (
  <img src="/logo-komet.png" alt="Komet" className={className} />
);

const INITIAL_STEPS: OnboardingStep[] = [
  { id: "connect", title: "Connect Social Accounts", description: "Link your Twitter, Instagram, LinkedIn, and more", icon: KometLogoImg, href: "/accounts/connect", isComplete: false },
  { id: "first_post", title: "Create Your First Post", description: "Write, customize, and schedule your first piece of content", icon: KometLogoImg, href: "/posts/create", isComplete: false },
  { id: "profile", title: "Complete Your Profile", description: "Set up your workspace, avatar, and preferences", icon: KometLogoImg, href: "/settings", isComplete: false },
  { id: "invite_team", title: "Invite Team Members", description: "Bring your collaborators on board", icon: KometLogoImg, href: "/team", isComplete: false },
  { id: "explore_ai", title: "Explore AI Studio", description: "Try generating content with artificial intelligence", icon: KometLogoImg, href: "/ai", isComplete: false },
  { id: "media_upload", title: "Upload Media Assets", description: "Add images and videos to your media library", icon: KometLogoImg, href: "/media", isComplete: false },
];

export default function OnboardingPage() {
  const [steps, setSteps] = useState(INITIAL_STEPS);

  const completedCount = steps.filter((s) => s.isComplete).length;
  const isAllComplete = completedCount === steps.length;

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
        Back to Dashboard
      </Link>

      {/* Welcome Header */}
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] mb-6">
          {isAllComplete ? (
            <CheckCircle className="h-8 w-8 text-white" />
          ) : (
            <img src="/logo-komet.png" alt="Komet" className="h-8 w-8 object-contain" />
          )}
        </div>
        <h1 className="font-display text-4xl font-bold text-[var(--color-on-dark)]">
          {isAllComplete ? "Welcome to Komet! 🎉" : "Let's Get Started"}
        </h1>
        <p className="mt-3 text-body-lg text-[var(--color-on-dark-soft)] max-w-xl mx-auto">
          {isAllComplete
            ? "You've completed all the setup steps. You're ready to start scheduling content!"
            : "Complete the steps below to set up your workspace and start managing your social media."}
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Steps", value: steps.length, color: "text-[var(--color-on-dark)]" },
          { label: "Completed", value: completedCount, color: "text-[var(--color-success)]" },
          { label: "Remaining", value: steps.length - completedCount, color: "text-[var(--color-warning)]" },
        ].map((stat) => (
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
          Need Help?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: "Documentation", description: "Read our guides and API docs", href: "#" },
            { title: "Video Tutorials", description: "Watch step-by-step walkthroughs", href: "#" },
            { title: "Community Forum", description: "Ask questions and share tips", href: "#" },
            { title: "Support Team", description: "Contact us for personalized help", href: "#" },
          ].map((item) => (
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
