"use client";
import { PageShell } from "@/components/page-shell";

export default function CookiesPage() {
  return (
    <PageShell title="Cookie Policy" description="Last updated: June 2026">
      <div className="prose prose-invert max-w-none space-y-8 text-sm sm:text-base">
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">What Are Cookies</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help us remember your preferences,
            keep you signed in, and understand how you use Komet.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">How We Use Cookies</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            We use essential cookies for authentication and security. We use analytics cookies to understand usage patterns and
            improve the Service. We do not use third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">Types of Cookies We Use</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-on-dark-soft)] leading-relaxed">
            <li><strong className="text-[var(--color-on-dark)]">Essential Cookies:</strong> Required for the Service to function (authentication, security).</li>
            <li><strong className="text-[var(--color-on-dark)]">Preference Cookies:</strong> Remember your settings like language and theme.</li>
            <li><strong className="text-[var(--color-on-dark)]">Analytics Cookies:</strong> Help us measure and improve performance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">Managing Cookies</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            Most browsers allow you to control cookies through their settings. You can usually delete existing cookies, block
            third-party cookies, or block all cookies. Note that blocking essential cookies may prevent Komet from functioning
            properly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">Contact</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            Questions about our Cookie Policy? Contact us at <span className="text-[var(--color-primary)]">hello@komet.so</span>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
