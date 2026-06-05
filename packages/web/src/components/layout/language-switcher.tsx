"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "id", label: "Bahasa Indonesia" },
] as const;

interface LanguageSwitcherProps {
  collapsed?: boolean;
}

export function LanguageSwitcher({ collapsed = false }: LanguageSwitcherProps) {
  const locale = useLocale();

  const switchLocale = (newLocale: string) => {
    // Set NEXT_LOCALE cookie and reload to apply
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className={cn(collapsed ? "flex flex-col items-center gap-1" : "space-y-1")}>
      <span
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast",
          "text-[var(--color-on-dark-soft)]",
          "light:text-[var(--color-ink-soft)]",
          collapsed && "justify-center px-0"
        )}
      >
        <Globe className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="text-xs text-[var(--color-on-dark-muted)] light:text-[var(--color-ink-faint)]">Language</span>}
      </span>
      <div className={cn("flex", collapsed ? "flex-col gap-1" : "flex-col gap-0.5 px-3")}>
        {LOCALES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => switchLocale(lang.code)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              locale === lang.code
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] light:text-[var(--color-ink-soft)] light:hover:text-[var(--color-ink)]",
              collapsed && "justify-center px-0"
            )}
            title={lang.label}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold uppercase">
              {lang.code}
            </span>
            {!collapsed && <span>{lang.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
