import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4">
          <Link href="/" className="text-xl font-bold text-foreground">
            Komet
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: June 7, 2026</p>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">1. Introduction</h2>
          <p className="leading-relaxed text-muted-foreground">
            Komet (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a social media scheduling platform that helps creators, teams, and developers manage and publish content across multiple social media platforms. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            By using Komet, you agree to the collection and use of information in accordance with this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">2. Information We Collect</h2>

          <h3 className="mb-2 text-lg font-medium text-foreground">2.1 Personal Information</h3>
          <p className="leading-relaxed text-muted-foreground">
            When you create an account or connect a social media account, we may collect:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Email address</li>
            <li>Display name and username</li>
            <li>Profile picture</li>
            <li>Social media account IDs and access tokens (with your permission)</li>
          </ul>

          <h3 className="mb-2 mt-4 text-lg font-medium text-foreground">2.2 Social Media Content</h3>
          <p className="leading-relaxed text-muted-foreground">
            With your explicit authorization, we access:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Posts and media you create or schedule through our platform</li>
            <li>Engagement metrics (likes, comments, shares) for connected accounts</li>
            <li>Follower count and basic analytics</li>
          </ul>

          <h3 className="mb-2 mt-4 text-lg font-medium text-foreground">2.3 Technical Data</h3>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>IP address and usage patterns</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
          <p className="leading-relaxed text-muted-foreground">We use the collected information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Provide, maintain, and improve our social media scheduling services</li>
            <li>Schedule, publish, and manage your content across connected platforms</li>
            <li>Generate analytics and insights for your social media accounts</li>
            <li>Send notifications about your scheduled posts and account activity</li>
            <li>Respond to your support requests and inquiries</li>
            <li>Detect, prevent, and address technical issues and abuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">4. Data Sharing and Disclosure</h2>
          <p className="leading-relaxed text-muted-foreground">
            We do not sell your personal information. We may share your data only in the following circumstances:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li><strong>Social Media Platforms:</strong> Data is shared with the platforms you authorize (e.g., Facebook, Twitter, Instagram) through their APIs to perform actions on your behalf.</li>
            <li><strong>Service Providers:</strong> We may engage third-party companies (e.g., cloud hosting, database services) to facilitate our service, subject to confidentiality agreements.</li>
            <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal requests.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">5. Data Security</h2>
          <p className="leading-relaxed text-muted-foreground">
            We implement industry-standard security measures, including encryption at rest and in transit, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure. We store access tokens securely and never expose them publicly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">6. Data Retention</h2>
          <p className="leading-relaxed text-muted-foreground">
            We retain your personal information for as long as your account is active. When you disconnect a social media account or delete your Komet account, we remove associated access tokens and social media content within 30 days. Analytics data may be retained in anonymized form.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">7. Your Rights</h2>
          <p className="leading-relaxed text-muted-foreground">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Access and update your personal information</li>
            <li>Disconnect any social media account at any time</li>
            <li>Delete your account and associated data</li>
            <li>Request a copy of your data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">8. User Data Deletion</h2>
          <p className="leading-relaxed text-muted-foreground">
            To request deletion of your data, you can:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Use the account deletion option in your account settings within the app</li>
            <li>Send a deletion request to <a href="mailto:kustoro2025@gmail.com" className="text-primary underline">kustoro2025@gmail.com</a></li>
          </ul>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Upon receiving your request, we will delete your personal information within 30 days, unless retention is required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-foreground">9. Contact Information</h2>
          <p className="leading-relaxed text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2 text-foreground">
            Email: <a href="mailto:kustoro2025@gmail.com" className="text-primary underline">kustoro2025@gmail.com</a>
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Komet. All rights reserved.</p>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>Privacy Policy</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
