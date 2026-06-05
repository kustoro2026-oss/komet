"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/login?registered=true");
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
          {t("registerTitle")}
        </h1>
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
          {t("registerSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 px-4 py-3 text-body-sm text-[var(--color-error)]">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
            {t("fullName")}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            minLength={6}
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-2.5 text-button font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? t("creatingAccount") : t("createAccount")}
        </button>
      </form>

      <p className="text-center text-body-sm text-[var(--color-on-dark-soft)]">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-light)]">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
