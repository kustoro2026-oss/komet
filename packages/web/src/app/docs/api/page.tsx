"use client";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/page-shell";
import { Code2, Key, Server } from "lucide-react";

export default function ApiReferencePage() {
  const t = useTranslations("apiDocs");

  const endpoints = [
    { method: "GET", path: "/v1/accounts", desc: t("epListAccounts") },
    { method: "GET", path: "/v1/accounts/{id}", desc: t("epGetAccount") },
    { method: "POST", path: "/v1/posts", desc: t("epCreatePost") },
    { method: "GET", path: "/v1/posts", desc: t("epListPosts") },
    { method: "GET", path: "/v1/posts/{id}", desc: t("epGetPost") },
    { method: "DELETE", path: "/v1/posts/{id}", desc: t("epDeletePost") },
    { method: "GET", path: "/v1/analytics", desc: t("epGetAnalytics") },
    { method: "GET", path: "/v1/analytics/{platform}", desc: t("epGetPlatformAnalytics") },
  ];

  return (
    <PageShell title={t("title")} description={t("description")}>
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4 text-[var(--color-primary)]" />
              <h3 className="font-semibold text-[var(--color-on-dark)] text-sm">{t("authHeading")}</h3>
            </div>
            <p className="text-sm text-[var(--color-on-dark-soft)] leading-relaxed">
              {t("authText")}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Server className="h-4 w-4 text-[var(--color-primary)]" />
              <h3 className="font-semibold text-[var(--color-on-dark)] text-sm">{t("baseUrlLabel")}</h3>
            </div>
            <p className="text-sm text-[var(--color-on-dark-soft)] leading-relaxed">
              <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--color-primary)] text-xs break-all">https://api.kontenmumelesat.com/v1</code>
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--color-on-dark)] mb-4 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[var(--color-primary)]" />
            {t("endpointsHeading")}
          </h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
            {endpoints.map((ep) => (
              <div key={ep.path} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 px-5 py-3.5">
                <span className={`inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-semibold ${
                  ep.method === "GET" ? "bg-emerald-500/10 text-emerald-400" :
                  ep.method === "POST" ? "bg-blue-500/10 text-blue-400" :
                  ep.method === "DELETE" ? "bg-red-500/10 text-red-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>{ep.method}</span>
                <code className="text-xs sm:text-sm text-[var(--color-on-dark)] break-all">{ep.path}</code>
                <span className="text-xs text-[var(--color-on-dark-muted)] sm:ml-auto sm:text-right">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
