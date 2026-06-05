"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { LanguageSwitcher } from "./language-switcher";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Inbox,
  Sparkles,
  Bot,
  Image,
  Settings,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  ChevronDown,
  Check,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/calendar", labelKey: "calendar", icon: Calendar },
  { href: "/posts", labelKey: "posts", icon: FileText },
  { href: "/accounts", labelKey: "accounts", icon: Users },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/inbox", labelKey: "inbox", icon: Inbox },
  { href: "/ai", labelKey: "aiStudio", icon: Sparkles },
  { href: "/auto-reply", labelKey: "autoReply", icon: Bot },
  { href: "/media", labelKey: "media", icon: Image },
  { href: "/settings", labelKey: "settings", icon: Settings },
  { href: "/team", labelKey: "team", icon: UserPlus },
];

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const { workspaces, activeWorkspace, setActiveWorkspace, fetchWorkspaces, createWorkspace } = useWorkspaceStore();
  const [mounted, setMounted] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  // Fetch workspaces from API on mount; fall back to localStorage
  useEffect(() => {
    setMounted(true);
    fetchWorkspaces();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sidebarContent = (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r transition-all duration-normal",
        // Dark mode (default)
        "bg-[var(--color-surface-dark)] border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)]",
        // Light mode override
        "light:bg-[var(--color-canvas)] light:border-[var(--color-hairline)] light:text-[var(--color-ink-soft)]",
        collapsed ? "w-[72px]" : "w-[264px]"
      )}
    >
      {/* Logo Area */}
      <div
        className={cn(
          "flex h-16 items-center border-b px-4",
          "border-[var(--color-ink-muted)]",
          "light:border-[var(--color-hairline)]",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {collapsed ? (
          <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
              <span className="font-display text-lg font-semibold text-[var(--color-on-dark)] light:text-[var(--color-ink)]">
                Komet
              </span>
            </Link>
          </>
        )}
        {/* Collapse toggle - visible on desktop/tablet */}
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="hidden rounded-md p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)] light:hover:bg-[var(--color-hairline-soft)] light:hover:text-[var(--color-ink)] md:block"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Workspace Switcher */}
      {!collapsed && mounted && activeWorkspace && (
        <div className="relative px-3 pt-3">
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-body-sm font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] light:text-[var(--color-ink)] light:hover:bg-[var(--color-hairline-soft)] transition-colors"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)] text-micro font-bold text-white">
              {activeWorkspace.name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-left">{activeWorkspace.name}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-[var(--color-on-dark-muted)] transition-transform ${workspaceOpen ? "rotate-180" : ""}`} />
          </button>
          {workspaceOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-1 shadow-xl">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws);
                    setWorkspaceOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)]"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-primary)]/20 text-micro font-bold text-[var(--color-primary-light)]">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate text-left">{ws.name}</span>
                  {ws.id === activeWorkspace.id && (
                    <Check className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  )}
                </button>
              ))}
              <div className="border-t border-[var(--color-ink-muted)] mt-1 pt-1">
                <button
                  onClick={() => {
                    setWorkspaceOpen(false);
                    setShowNewWorkspace(true);
                    setNewWorkspaceName("");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-body-sm text-[var(--color-primary-light)] hover:bg-[var(--color-surface-dark-raised)]"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {tc("newWorkspace")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Workspace Dialog */}
      {showNewWorkspace && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowNewWorkspace(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 shadow-xl">
            <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)] mb-1">
              {tc("newWorkspace")}
            </h3>
            <p className="text-body-sm text-[var(--color-on-dark-soft)] mb-4">
              Enter a name for your new workspace
            </p>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newWorkspaceName.trim()) {
                  const name = newWorkspaceName.trim();
                  setNewWorkspaceName("");
                  createWorkspace(name);
                  setShowNewWorkspace(false);
                }
                if (e.key === "Escape") setShowNewWorkspace(false);
              }}
              placeholder="My New Workspace"
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNewWorkspace(false)}
                className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={() => {
                  if (!newWorkspaceName.trim()) return;
                  const name = newWorkspaceName.trim();
                  setNewWorkspaceName("");
                  createWorkspace(name);
                  setShowNewWorkspace(false);
                }}
                disabled={!newWorkspaceName.trim()}
                className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {tc("create")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-all duration-fast",
                    "tracking-[0.2px]",
                    isActive
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)] light:text-[var(--color-ink-soft)] light:hover:bg-[var(--color-hairline-soft)] light:hover:text-[var(--color-ink)]",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{t(item.labelKey)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="hidden border-t border-[var(--color-ink-muted)] px-3 py-3 md:block light:border-[var(--color-hairline)]">
          <button
            onClick={toggleCollapsed}
            className="flex h-10 w-full items-center justify-center rounded-md text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)] light:hover:bg-[var(--color-hairline-soft)] light:hover:text-[var(--color-ink)]"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bottom Section */}
      <div
        className={cn(
          "border-t p-3",
          "border-[var(--color-ink-muted)]",
          "light:border-[var(--color-hairline)]",
          collapsed && "px-2"
        )}
      >
        {/* Theme Toggle */}
        {mounted && (
          <>
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast",
                "text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)]",
                "light:text-[var(--color-ink-soft)] light:hover:bg-[var(--color-hairline-soft)] light:hover:text-[var(--color-ink)]",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? (theme === "dark" ? tc("lightMode") : tc("darkMode")) : undefined}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 shrink-0" />
              ) : (
                <Moon className="h-5 w-5 shrink-0" />
              )}
              {!collapsed && <span>{theme === "dark" ? tc("lightMode") : tc("darkMode")}</span>}
            </button>

            {/* Language Switcher */}
            <div className={cn("mt-1", collapsed && "flex justify-center")}>
              <LanguageSwitcher collapsed={collapsed} />
            </div>
          </>
        )}

        {/* User Section */}
        <div
          className={cn(
            "mt-2 flex items-center gap-3 rounded-md px-3 py-2",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-on-primary)]">
            U
          </div>
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-[var(--color-on-dark)] light:text-[var(--color-ink)]">
                User Name
              </span>
              <span className="truncate text-xs text-[var(--color-on-dark-muted)] light:text-[var(--color-ink-faint)]">
                user@komet.app
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  // Mobile: overlay drawer
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}
      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden",
          mobileOpen ? "fixed inset-y-0 left-0 z-30" : "hidden"
        )}
      >
        {sidebarContent}
      </div>
      {/* Desktop/Tablet: always visible */}
      <div className="hidden md:block">{sidebarContent}</div>
    </>
  );
}
