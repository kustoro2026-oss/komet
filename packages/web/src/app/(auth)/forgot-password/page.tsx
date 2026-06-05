"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]">
          <Sparkles className="h-6 w-6 text-[var(--color-on-primary)]" />
        </div>
        <h1 className="mt-4 font-display text-display-sm font-bold text-[var(--color-on-dark)]">
          {t("forgotTitle")}
        </h1>
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
          {sent ? t("forgotCheckEmail") : t("forgotSubtitle")}
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-4 text-center">
          <p className="text-body-sm text-[var(--color-success)]">
            {t("forgotResetSent")}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 px-4 py-3 text-body-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-2.5 text-button font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? t("forgotSending") : t("sendReset")}
          </button>
        </form>
      )}

      <p className="text-center text-body-sm text-[var(--color-on-dark-soft)]">
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-light)]">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
