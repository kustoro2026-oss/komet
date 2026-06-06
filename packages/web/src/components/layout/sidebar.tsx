"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { LanguageSwitcher } from "./language-switcher";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Inbox,
  Bell,
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
  Trash2,
  AlertTriangle,
  LogOut,
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
  { href: "/notifications", labelKey: "notifications", icon: Bell },
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // proceed to redirect even if signOut fails
    }
    router.push("/login");
  };

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
        {/* Collapse/Expand toggle - visible on desktop/tablet */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "hidden rounded-md p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)] light:hover:bg-[var(--color-hairline-soft)] light:hover:text-[var(--color-ink)] md:block",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
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
                <div key={ws.id} className="group relative">
                  <button
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
                    {ws.id !== activeWorkspace.id && workspaces.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(ws.id);
                        }}
                        className="hidden group-hover:flex items-center justify-center h-5 w-5 rounded text-[var(--color-on-dark-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </button>
                </div>
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

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setConfirmDeleteId(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                <AlertTriangle className="h-5 w-5 text-[var(--color-error)]" />
              </div>
              <div>
                <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
                  {tc("delete") || "Delete Workspace"}
                </h3>
                <p className="text-caption text-[var(--color-on-dark-soft)]">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-body-sm text-[var(--color-on-dark-soft)] mb-4">
              Are you sure you want to delete{' '}
              <span className="font-medium text-[var(--color-on-dark)]">
                {workspaces.find((w) => w.id === confirmDeleteId)?.name}
              </span>
              ? All data will be lost.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={() => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  useWorkspaceStore.getState().deleteWorkspace(id);
                }}
                className="rounded-lg bg-[var(--color-error)] px-3 py-1.5 text-button-sm text-white hover:bg-[var(--color-error)]/90"
              >
                {tc("delete") || "Delete"}
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

      {/* Bottom Section */}
      <div
        className={cn(
          "mt-auto border-t p-3 space-y-2",
          "border-[var(--color-ink-muted)]",
          "light:border-[var(--color-hairline)]",
          collapsed && "px-2"
        )}
      >
        {mounted && (
          <>
            {/* Language + Theme row */}
            <div className="flex items-center gap-1">
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <LanguageSwitcher collapsed={false} />
                </div>
              )}

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-fast",
                  "text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)]",
                  "light:text-[var(--color-ink-soft)] light:hover:bg-[var(--color-hairline-soft)] light:hover:text-[var(--color-ink)]",
                  collapsed ? "justify-center w-full" : "shrink-0"
                )}
                title={theme === "dark" ? tc("lightMode") : tc("darkMode")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" />
                )}
                {!collapsed && <span>{theme === "dark" ? tc("lightMode") : tc("darkMode")}</span>}
              </button>
            </div>

            {collapsed && (
              <div className="flex justify-center">
                <LanguageSwitcher collapsed={true} />
              </div>
            )}
          </>
        )}

        {/* Separator */}
        <div className="h-px bg-[var(--color-ink-muted)]/50 light:bg-[var(--color-hairline)]" />

        {/* User Section */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-deep)] text-xs font-semibold text-[var(--color-on-primary)] shadow-sm">
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

        {/* Separator */}
        <div className="h-px bg-[var(--color-ink-muted)]/50 light:bg-[var(--color-hairline)]" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-fast group",
            "text-[var(--color-on-dark-muted)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]",
            "light:text-[var(--color-ink-faint)] light:hover:bg-[var(--color-error)]/10 light:hover:text-[var(--color-error)]",
            collapsed && "justify-center px-0"
          )}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          {!collapsed && (
            <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
          )}
        </button>
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
