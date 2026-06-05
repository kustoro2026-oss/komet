"use client";

import { Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./notification-dropdown";

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
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
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo - Centered */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
        <span className="font-display text-base font-semibold text-[var(--color-ink)] dark:text-[var(--color-on-dark)]">
          Komet
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Notification Bell with Dropdown */}
        <NotificationDropdown />

        {/* User Avatar */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-on-primary)]"
          aria-label="User menu"
        >
          U
        </button>
      </div>
    </header>
  );
}
