"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  User,
  Sparkles,
  Users,
  BadgeCheck,
  ArrowUpRight,
} from "lucide-react";

interface CheckResult {
  username: string;
  available: boolean;
  error?: string;
}

interface Suggestion {
  username: string;
  displayName: string;
  verified: boolean;
}

export default function TikTokUsernameCheckerPage() {
  const t = useTranslations("tools");
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions when result is available or error
  useEffect(() => {
    if (!result) {
      setSuggestions([]);
      return;
    }

    const shouldFetch = result.available || !!result.error;

    if (shouldFetch && result.username) {
      setSuggestionsLoading(true);
      fetch(
        `/api/tool/tiktok-suggestions?q=${encodeURIComponent(result.username)}`
      )
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data.suggestions || []);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setSuggestionsLoading(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [result]);

  const checkUsername = useCallback(async () => {
    const trimmed = username.replace(/^@/, "").trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setSuggestions([]);

    try {
      const res = await fetch(
        `/api/tool/tiktok-check?username=${encodeURIComponent(trimmed)}`
      );
      const data: CheckResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        username: trimmed,
        available: false,
        error: t("networkError"),
      });
    } finally {
      setLoading(false);
    }
  }, [username, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      checkUsername();
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-white/[0.06] px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]"
          >
            {t("tiktokCheckerTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-[var(--color-on-dark-soft)] leading-relaxed"
          >
            {t("tiktokCheckerDesc")}
          </motion.p>
        </div>
      </section>

      {/* Checker Form */}
      <section className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-xl">
          {/* Input */}
          <div className="relative">
            <div className="flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] focus-within:border-[var(--color-primary)]/40 focus-within:bg-white/[0.05] transition-all duration-200">
              <span className="pl-5 text-[var(--color-on-dark-muted)] select-none text-sm sm:text-base">
                tiktok.com/@
              </span>
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("tiktokCheckerPlaceholder")}
                className="flex-1 bg-transparent py-4 px-2 text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] outline-none text-sm sm:text-base"
                autoComplete="off"
                spellCheck={false}
                maxLength={30}
              />
              <button
                onClick={checkUsername}
                disabled={loading || !username.trim()}
                className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.username + result.available}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mt-6"
              >
                {result.error && !result.available ? (
                  /* ── Error state ── */
                  <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.03] p-6 shadow-lg shadow-amber-500/5">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
                    <div className="relative flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-amber-200 text-sm tracking-tight">
                          {t("checkError")}
                        </h3>
                        <p className="mt-1.5 text-sm text-amber-300/60 leading-relaxed">
                          {result.error}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : result.available ? (
                  /* ── Available state ── */
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-emerald-600/[0.03] p-6 shadow-lg shadow-emerald-500/5">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="absolute right-4 top-4">
                      <Sparkles className="h-4 w-4 text-emerald-400/40" />
                    </div>
                    <div className="relative flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                            {t("available")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-emerald-200 text-base tracking-tight">
                          @{result.username}
                        </h3>
                        <p className="mt-1.5 text-sm text-emerald-300/60 leading-relaxed">
                          {t("usernameAvailableDesc")}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          <a
                            href={`https://www.tiktok.com/@${result.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/30 active:scale-[0.97] transition-all ring-1 ring-emerald-500/25"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t("viewOnTikTok")}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Taken state ── */
                  <div className="relative overflow-hidden rounded-2xl border border-red-500/15 bg-gradient-to-br from-red-500/[0.06] to-red-600/[0.02] p-6 shadow-lg shadow-red-500/5">
                    {/* Background glow */}
                    <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-red-500/8 blur-2xl" />
                    <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-rose-500/6 blur-2xl" />

                    <div className="relative">
                      {/* Header row: status badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-300 ring-1 ring-red-500/15">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          {t("taken")}
                        </span>
                      </div>

                      {/* Profile-like card */}
                      <div className="flex items-center gap-4">
                        {/* Avatar placeholder */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/15 ring-2 ring-red-500/20">
                          <span className="text-lg font-bold text-red-300 uppercase">
                            {result.username.charAt(0)}
                          </span>
                        </div>

                        {/* Username & details */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base text-red-100 tracking-tight truncate">
                            @{result.username}
                          </h3>
                          <p className="mt-0.5 text-sm text-red-300/50 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {t("usernameTaken")}
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="my-4 h-px bg-gradient-to-r from-red-500/10 via-red-500/15 to-transparent" />

                      {/* Action button */}
                      <div className="flex flex-wrap gap-2.5">
                        <a
                          href={`https://www.tiktok.com/@${result.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/25 active:scale-[0.97] transition-all ring-1 ring-red-500/20"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {t("viewProfile")}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Suggestions ── */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-6"
              >
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                      <Users className="h-4 w-4 text-[var(--color-on-dark-soft)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-on-dark)] text-sm">
                        {t("suggestionsTitle")}
                      </h3>
                      <p className="text-xs text-[var(--color-on-dark-muted)]">
                        {t("suggestionsSubtitle")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {suggestions.map((s, i) => (
                      <motion.a
                        key={s.username}
                        href={`https://www.tiktok.com/@${s.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] transition-colors group"
                      >
                        {/* Avatar */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-purple-500/15 ring-1 ring-white/[0.06] text-xs font-bold text-[var(--color-on-dark-soft)] uppercase">
                          {s.username.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm text-[var(--color-on-dark)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                              @{s.username}
                            </span>
                            {s.verified && (
                              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-on-dark-muted)] truncate">
                            {s.displayName !== s.username ? s.displayName : ""}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--color-on-dark-muted)] group-hover:text-[var(--color-on-dark-soft)] transition-colors" />
                      </motion.a>
                    ))}
                  </div>

                  {/* Search more link */}
                  <div className="mt-4 pt-3 border-t border-white/[0.04]">
                    <a
                      href={`https://www.tiktok.com/search?q=${encodeURIComponent(result?.username || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark-soft)] transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" />
                      {t("searchMoreOnTikTok")}
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {suggestionsLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 flex items-center justify-center gap-2 py-6"
              >
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-on-dark-muted)]" />
                <span className="text-xs text-[var(--color-on-dark-muted)]">
                  {t("loadingSuggestions")}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
            <h3 className="font-semibold text-[var(--color-on-dark)] text-sm mb-3">
              {t("tiktokCheckerTipsTitle")}
            </h3>
            <ul className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[var(--color-on-dark-soft)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-on-dark-muted)]" />
                  {t(`tiktokCheckerTip${i}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
