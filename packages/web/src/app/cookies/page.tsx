"use client";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/page-shell";

export default function CookiesPage() {
  const t = useTranslations("cookies");
  return (
    <PageShell title={t("title")} description={t("description")}>
      <div className="prose prose-invert max-w-none space-y-8 text-sm sm:text-base">
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("whatAreHeading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("whatAreText")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("howWeUseHeading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("howWeUseText")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("typesHeading")}</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-on-dark-soft)] leading-relaxed">
            <li><strong className="text-[var(--color-on-dark)]">{t("essentialLabel")}</strong>{" "}{t("essentialDesc")}</li>
            <li><strong className="text-[var(--color-on-dark)]">{t("preferenceLabel")}</strong>{" "}{t("preferenceDesc")}</li>
            <li><strong className="text-[var(--color-on-dark)]">{t("analyticsLabel")}</strong>{" "}{t("analyticsDesc")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("managingHeading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("managingText")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-3">{t("contactHeading")}</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            {t("contactText")}{" "}
            <span className="text-[var(--color-primary)]">hello@kontenmumelesat.com</span>
            .
          </p>
        </section>
      </div>
    </PageShell>
  );
}
