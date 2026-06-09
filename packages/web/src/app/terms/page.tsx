"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export default function TermsPage() {
  const t = useTranslations("terms");
  return (
    <PageShell title={t("title")} description={t("description")}>
      <div className="prose prose-invert max-w-none space-y-8 text-sm sm:text-base">
        <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
          {t("privacyNote")}{" "}
          <Link href="/privacy" className="text-[var(--color-primary)] hover:underline">
            {t("privacyPolicy")}
          </Link>
          .
        </p>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("section1Heading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("section1Text")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("section2Heading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("section2Text")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("section3Heading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("section3Text")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("section4Heading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("section4Text")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("section5Heading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("section5Text")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("section6Heading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("section6Text")}{" "}
            <span className="text-[var(--color-primary)]">hello@kontenmumelesat.com</span>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
