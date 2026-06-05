import Link from "next/link";

const FEATURES = [
  {
    title: "Multi-Platform Scheduling",
    description: "Schedule and publish content across Twitter, Instagram, LinkedIn, Facebook, TikTok, YouTube, and more from one dashboard.",
    gradient: "from-[var(--color-primary)] to-[var(--color-accent)]",
  },
  {
    title: "AI Content Studio",
    description: "Generate engaging captions, threads, and hashtags with AI. Adapt your content for different platforms and audiences.",
    gradient: "from-[var(--color-accent)] to-[var(--color-primary)]",
  },
  {
    title: "Unified Analytics",
    description: "Track engagement, followers, and performance across all platforms. Get actionable insights to grow your audience.",
    gradient: "from-[var(--color-success)] to-[var(--color-primary)]",
  },
  {
    title: "Smart Inbox",
    description: "Manage comments and messages from all platforms in one place. Set up auto-replies and never miss an engagement.",
    gradient: "from-[var(--color-warning)] to-[var(--color-accent)]",
  },
  {
    title: "Content Calendar",
    description: "Plan your content strategy with a visual calendar. Drag and drop to reschedule, and never miss a posting date.",
    gradient: "from-[var(--color-error)] to-[var(--color-warning)]",
  },
  {
    title: "Team Collaboration",
    description: "Invite team members, assign roles, and collaborate on content. Review and approve posts before they go live.",
    gradient: "from-[var(--color-primary)] to-[var(--color-success)]",
  },
];

const PLATFORMS = [
  { name: "Twitter / X", color: "#1DA1F2" },
  { name: "Instagram", color: "#E4405F" },
  { name: "LinkedIn", color: "#0A66C2" },
  { name: "Facebook", color: "#1877F2" },
  { name: "TikTok", color: "#000000" },
  { name: "YouTube", color: "#FF0000" },
  { name: "Pinterest", color: "#E60023" },
  { name: "Reddit", color: "#FF4500" },
  { name: "Bluesky", color: "#0085FF" },
  { name: "Threads", color: "#000000" },
  { name: "Mastodon", color: "#6364FF" },
  { name: "Tumblr", color: "#35465C" },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: ["1 workspace", "3 connected accounts", "20 posts/month", "Basic analytics", "Content calendar"],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Creator",
    price: "$9",
    description: "For individual creators",
    features: ["3 workspaces", "10 connected accounts", "Unlimited posts", "AI content generation", "Advanced analytics", "Auto-reply rules"],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Pro",
    price: "$39",
    description: "For growing teams",
    features: ["10 workspaces", "25 connected accounts", "Unlimited posts", "AI content studio", "Custom analytics", "Team collaboration", "API access", "Priority support"],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Business",
    price: "$99",
    description: "For large organizations",
    features: ["Unlimited workspaces", "Unlimited accounts", "Everything in Pro", "White-label reports", "Custom integrations", "Dedicated support", "SLA guarantee", "Onboarding specialist"],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 blur-[120px]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-4 py-1.5 text-caption text-[var(--color-on-dark-soft)] mb-8">
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" />
            Now supporting 15+ social platforms
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--color-on-dark)] leading-tight">
            Your content blasts to
            <br />
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              every platform
            </span>
            <br />
            in a flash.
          </h1>
          <p className="mt-6 text-body-lg text-[var(--color-on-dark-soft)] max-w-2xl mx-auto leading-relaxed">
            Komet is the 3-in-1 social media scheduling platform for creators, teams, and developers.
            Write once, publish everywhere — with AI-powered content adaptation.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-8 py-4 text-button font-medium text-white hover:opacity-90 transition-opacity shadow-glow"
            >
              Get Started Free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-ink-muted)] px-8 py-4 text-button font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-elevated)] transition-colors"
            >
              Sign In Free
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8 text-caption text-[var(--color-on-dark-muted)]">
            <span>No credit card required</span>
            <span className="h-1 w-1 rounded-full bg-[var(--color-ink-muted)]" />
            <span>Free plan available</span>
            <span className="h-1 w-1 rounded-full bg-[var(--color-ink-muted)]" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Platform Badges */}
      <section className="py-16 border-y border-[var(--color-ink-muted)]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-caption-uppercase text-[var(--color-on-dark-muted)] mb-8">
            Connect and manage all your platforms
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map((platform) => (
              <span
                key={platform.name}
                className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-4 py-2 text-body-sm font-medium text-[var(--color-on-dark)]"
              >
                {platform.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-[var(--color-on-dark)]">
              Everything you need to manage social media
            </h2>
            <p className="mt-4 text-body-lg text-[var(--color-on-dark-soft)] max-w-2xl mx-auto">
              From scheduling to analytics, Komet has all the tools to grow your online presence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 hover:border-[var(--color-ink-soft)] transition-all"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-[var(--color-surface-dark-elevated)]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-[var(--color-on-dark)]">
              How Komet Works
            </h2>
            <p className="mt-4 text-body-lg text-[var(--color-on-dark-soft)] max-w-2xl mx-auto">
              Three simple steps to supercharge your social media workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Connect Accounts", description: "Link your social media accounts with one click. OAuth-based authentication keeps your credentials secure." },
              { step: "02", title: "Create & Schedule", description: "Write your content once, adapt it for each platform with AI, and schedule it on a visual calendar." },
              { step: "03", title: "Publish & Analyze", description: "Your content publishes automatically. Track performance across all platforms in real-time." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-2xl font-bold text-white font-display mb-6">
                  {item.step}
                </div>
                <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">{item.title}</h3>
                <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)] max-w-sm mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-[var(--color-on-dark)]">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-body-lg text-[var(--color-on-dark-soft)] max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  tier.featured
                    ? "border-[var(--color-primary)] bg-[var(--color-surface-dark-elevated)] ring-1 ring-[var(--color-primary)]"
                    : "border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]"
                }`}
              >
                {tier.featured && (
                  <span className="inline-block mb-3 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-3 py-0.5 text-micro font-medium text-white w-fit">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-heading-lg font-bold text-[var(--color-on-dark)]">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-[var(--color-on-dark)]">{tier.price}</span>
                  <span className="text-body-sm text-[var(--color-on-dark-soft)]">/month</span>
                </div>
                <p className="mt-1 text-caption text-[var(--color-on-dark-soft)]">{tier.description}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-caption text-[var(--color-on-dark-soft)]">
                      <svg className="h-4 w-4 mt-0.5 text-[var(--color-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.name === "Business" ? "/contact" : "/register"}
                  className={`mt-8 block w-full rounded-lg py-3 text-center text-button-sm font-medium transition-all ${
                    tier.featured
                      ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white hover:opacity-90 shadow-glow"
                      : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark)]"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl border border-[var(--color-ink-muted)] bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 p-12">
            <h2 className="font-display text-4xl font-bold text-[var(--color-on-dark)]">
              Ready to streamline your social media?
            </h2>
            <p className="mt-4 text-body-lg text-[var(--color-on-dark-soft)] max-w-xl mx-auto">
              Join thousands of creators and teams who use Komet to manage their content across platforms.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-8 py-4 text-button font-medium text-white hover:opacity-90 transition-opacity shadow-glow"
              >
                Start Free
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-ink-muted)] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="url(#logo-gradient)" />
                <path d="M8 14L12 10L16 14L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="logo-gradient" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-display text-lg font-bold text-[var(--color-on-dark)]">Komet</span>
            </div>
            <p className="text-caption text-[var(--color-on-dark-muted)]">
              &copy; {new Date().getFullYear()} Komet. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-caption text-[var(--color-on-dark-muted)]">
              <Link href="/login" className="hover:text-[var(--color-on-dark)] transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-[var(--color-on-dark)] transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
