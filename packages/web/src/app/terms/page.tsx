"use client";
import { PageShell } from "@/components/page-shell";

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service" description="Last updated: June 2026">
      <div className="prose prose-invert max-w-none space-y-8 text-sm sm:text-base">
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">1. Acceptance of Terms</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            By accessing or using Komet (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not
            agree, you may not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">2. Account Responsibilities</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately
            of any unauthorized use of your account. Komet cannot and will not be liable for any loss or damage from your failure
            to comply with this security obligation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">3. Acceptable Use</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            You agree not to misuse the Service. This includes, but is not limited to: violating any laws, infringing intellectual
            property rights, sending spam, distributing malware, or attempting to gain unauthorized access to our systems.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">4. Service Availability</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to modify, suspend,
            or discontinue the Service with reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">5. Limitation of Liability</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            To the fullest extent permitted by law, Komet shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages arising out of your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">6. Contact</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            Questions about these Terms? Contact us at <span className="text-[var(--color-primary)]">hello@komet.so</span>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
