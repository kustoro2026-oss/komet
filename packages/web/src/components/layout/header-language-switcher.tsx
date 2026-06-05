"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa Indonesia" },
] as const;

export function HeaderLanguageSwitcher() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  const currentLabel = LOCALES.find((l) => l.code === locale)?.label ?? "English";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-raised)] px-3 py-1.5 text-caption text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{currentLabel}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-lg overflow-hidden z-50">
          {LOCALES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                switchLocale(lang.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm transition-colors ${
                locale === lang.code
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] font-medium"
                  : "text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)]"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold uppercase border border-[var(--color-ink-muted)]">
                {lang.code}
              </span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
