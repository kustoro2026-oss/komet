"use client";

import { Menu, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./notification-dropdown";
import { useAuthStore } from "@/stores/auth-store";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { KometLogo } from "@/components/ui/komet-logo";
import { useTranslations } from "next-intl";

interface TopNavProps {
  onMenuClick: () => void;
}

function getUserInitials(email: string | undefined, name?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("components");
  const tc = useTranslations("common");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    tc("fallbackUserName");
  const email = user?.email || t("fallbackEmail");
  const initials = getUserInitials(
    user?.email,
    user?.user_metadata?.full_name || user?.user_metadata?.name
  );

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between border-b px-4 md:hidden",
        "bg-[var(--color-canvas-pure)] border-[var(--color-hairline)]",
        "dark:bg-[var(--color-surface-dark)] dark:border-[var(--color-ink-muted)]"
      )}
    >
      {/* Hamburger Menu */}
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-hairline-soft)] dark:text-[var(--color-on-dark-soft)] dark:hover:bg-[var(--color-surface-dark-raised)]"
        aria-label={t("menuOpen")}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo - Centered */}
      <div className="flex items-center gap-2">
        <KometLogo size="sm" className="h-6 w-6" />
        <span className="font-display text-base font-semibold text-[var(--color-ink)] dark:text-[var(--color-on-dark)]">
          {tc("brandName")}
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Notification Bell with Dropdown */}
        <NotificationDropdown />

        {/* User Avatar + Menu */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-on-primary)] hover:opacity-90 transition-opacity"
            aria-label={t("userMenu")}
          >
            {initials}
          </button>

          {open && (
            <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border bg-[var(--color-canvas-pure)] shadow-xl dark:bg-[var(--color-surface-dark-elevated)] dark:border-[var(--color-ink-muted)]">
              {/* User info */}
              <div className="px-4 py-3 border-b border-[var(--color-hairline)] dark:border-[var(--color-ink-muted)]">
                <p className="text-sm font-semibold text-[var(--color-ink)] dark:text-[var(--color-on-dark)] truncate">
                  {displayName}
                </p>
                <p className="text-xs text-[var(--color-ink-faint)] dark:text-[var(--color-on-dark-muted)] truncate">
                  {email}
                </p>
              </div>
              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/settings/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-on-dark-soft)] hover:bg-[var(--color-hairline-soft)] dark:hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  {t("accountSettings")}
                </Link>
                <Link
                  href="/settings/workspace"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-ink-soft)] dark:text-[var(--color-on-dark-soft)] hover:bg-[var(--color-hairline-soft)] dark:hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                >
                  <User className="h-4 w-4" />
                  {t("workspaceLabel")}
                </Link>
              </div>
              {/* Logout */}
              <div className="border-t border-[var(--color-hairline)] dark:border-[var(--color-ink-muted)] py-1">
                <button
                  onClick={() => {
                    clearUser();
                    setOpen(false);
                    window.location.href = "/login";
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t("signOut")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
