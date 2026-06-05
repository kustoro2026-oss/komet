"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Sparkles,
  Settings,
} from "lucide-react";

const bottomNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/ai", label: "AI", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

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
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
