"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Sparkles,
  Settings,
} from "lucide-react";

const bottomNavItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/posts", labelKey: "posts", icon: FileText },
  { href: "/inbox", labelKey: "inbox", icon: Inbox },
  { href: "/ai", labelKey: "aiStudio", icon: Sparkles },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-around border-t md:hidden",
        "bg-[var(--color-canvas-pure)] border-[var(--color-hairline)]",
        "dark:bg-[var(--color-surface-dark)] dark:border-[var(--color-ink-muted)]",
        // Safe area padding for iOS
        "pb-[env(safe-area-inset-bottom,0px)]"
      )}
    >
      {bottomNavItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-all duration-fast",
              "min-w-0 flex-1",
              isActive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-ink-faint)] dark:text-[var(--color-on-dark-muted)]"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[11px] font-medium leading-tight">
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
