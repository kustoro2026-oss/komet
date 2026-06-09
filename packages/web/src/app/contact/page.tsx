"use client";
import { PageShell } from "@/components/page-shell";
import { Mail, MapPin, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("contact");

  const contacts = [
    { icon: Mail, title: t("email"), desc: t("emailDesc"), detail: t("emailDetail") },
    { icon: MapPin, title: t("location"), desc: t("locationDesc"), detail: t("locationDetail") },
    { icon: Clock, title: t("supportHours"), desc: t("supportHoursDesc"), detail: t("supportHoursDetail") },
  ];

  return (
    <PageShell title={t("title")} description={t("description")}>
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {contacts.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 text-center sm:text-left">
                <div className="mb-3 flex justify-center sm:justify-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                    <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                </div>
                <h3 className="font-semibold text-[var(--color-on-dark)] text-sm sm:text-base">{c.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-on-dark-soft)]">{c.desc}</p>
                <p className="mt-1 text-xs text-[var(--color-on-dark-muted)]">{c.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-2">{t("cta.title")}</h2>
          <p className="text-sm text-[var(--color-on-dark-soft)] mb-4">{t("cta.subtitle")}</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all"
          >
            {t("cta.button")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
