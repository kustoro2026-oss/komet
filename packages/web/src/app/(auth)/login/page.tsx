"use client";

import { useState, type FormEvent, Suspense } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showSuccess = registered;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
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
          Welcome back
        </h1>
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
          Sign in to your Komet account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {showSuccess && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-body-sm text-green-400 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Account created! Check your email to confirm your account, then sign in below.</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 px-4 py-3 text-body-sm text-[var(--color-error)]">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
            Email
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
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]" />
            <span className="text-caption text-[var(--color-on-dark-soft)]">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-caption font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-light)]"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-2.5 text-button font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-body-sm text-[var(--color-on-dark-soft)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-light)]">
          Sign up
        </Link>
      </p>
    </div>
  );
}
