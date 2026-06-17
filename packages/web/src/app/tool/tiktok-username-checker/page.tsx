"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";

interface CheckResult {
  username: string;
  available: boolean;
  error?: string;
}

export default function TikTokUsernameCheckerPage() {
  const t = useTranslations("tools");
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkUsername = useCallback(async () => {
    const trimmed = username.replace(/^@/, "").trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

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

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-6"
              >
                {result.error && !result.available ? (
                  /* Error state */
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-300 text-sm">
                          {t("checkError")}
                        </p>
                        <p className="mt-1 text-sm text-amber-200/70">
                          {result.error}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : result.available ? (
                  /* Available */
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-emerald-300 text-sm">
                          {t("usernameAvailable")}
                        </p>
                        <p className="mt-1 text-sm text-emerald-200/70 break-all">
                          @{result.username}
                        </p>
                        <button
                          onClick={() => handleCopy(result.username)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copied ? t("copied") : t("copyUsername")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Taken */
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-red-300 text-sm">
                          {t("usernameTaken")}
                        </p>
                        <p className="mt-1 text-sm text-red-200/70 break-all">
                          @{result.username}
                        </p>
                        <a
                          href={`https://www.tiktok.com/@${result.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-300 hover:text-red-200 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t("viewProfile")}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
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
