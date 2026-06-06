"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const LOCALES = [
  {
    code: "en",
    label: "English",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className="h-4 w-6 shrink-0 rounded-sm object-cover">
        <rect width="60" height="40" fill="#b31942" />
        <path stroke="#FFF" strokeWidth="3" d="M0 5h60m0 6H0m0 6h60m0 6H0m0 6h60m0 6H0" />
        <rect width="24" height="21" fill="#0a3161" />
        <g fill="#FFF">
          {[0, 1, 2, 3, 4].flatMap((row) =>
            [0, 1, 2, 3].map((col) => (
              <path
                key={`${row}-${col}`}
                d="m2.5 1 1.8 5.5H10L3.6 9.5l1.8 5.5-4.6-3.3L2.5 1z"
                transform={`translate(${col * 6}, ${row * 4.2}) scale(0.04)`}
              />
            ))
          )}
        </g>
      </svg>
    ),
  },
  {
    code: "id",
    label: "Bahasa Indonesia",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" className="h-4 w-6 shrink-0 rounded-sm object-cover">
        <rect width="60" height="40" fill="#fff" />
        <rect width="60" height="20" fill="#ce1126" />
      </svg>
    ),
  },
] as const;

interface LanguageSwitcherProps {
  collapsed?: boolean;
}

export function LanguageSwitcher({ collapsed = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (collapsed) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center rounded-lg p-2 text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)] light:text-[var(--color-ink-soft)] light:hover:bg-[var(--color-hairline-soft)] light:hover:text-[var(--color-ink)] transition-all duration-fast"
          title={current.label}
        >
          {current.flag}
        </button>
        {open && (
          <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-1 shadow-xl light:bg-[var(--color-canvas)] light:border-[var(--color-hairline)]">
            {LOCALES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { switchLocale(lang.code); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                  locale === lang.code
                    ? "text-[var(--color-primary)] font-semibold"
                    : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] light:text-[var(--color-ink-soft)] light:hover:text-[var(--color-ink)]"
                )}
              >
                {lang.flag}
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-fast",
          "text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)]",
          "light:text-[var(--color-ink-soft)] light:hover:bg-[var(--color-hairline-soft)] light:hover:text-[var(--color-ink)]"
        )}
      >
        {current.flag}
        <span className="flex-1 text-left">{current.label}</span>
        <svg
          className={cn("h-3.5 w-3.5 text-[var(--color-on-dark-muted)] transition-transform", open && "rotate-180")}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-1 shadow-xl light:bg-[var(--color-canvas)] light:border-[var(--color-hairline)]">
          {LOCALES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { switchLocale(lang.code); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                locale === lang.code
                  ? "text-[var(--color-primary)] font-semibold"
                  : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] light:text-[var(--color-ink-soft)] light:hover:text-[var(--color-ink)]"
              )}
            >
              {lang.flag}
              <span className="flex-1 text-left">{lang.label}</span>
              {locale === lang.code && (
                <svg className="h-3.5 w-3.5 text-[var(--color-primary)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
