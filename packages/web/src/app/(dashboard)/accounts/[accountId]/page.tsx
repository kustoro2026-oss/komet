"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Activity, Edit3, RefreshCw, Trash2, BarChart3 } from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";

const MOCK_ACCOUNT = {
  id: "acc1",
  platform: "twitter" as Platform,
  username: "komet_app",
  displayName: "Komet",
  avatarUrl: null,
  isActive: true,
  connectedAt: "2026-01-15T10:00:00Z",
  stats: { followers: 12500, following: 845, posts: 342, engagement: 3.2 },
  recentPosts: [
    { id: "p1", content: "Excited to announce our new feature! 🚀", engagement: 1234, publishedAt: "2026-06-04T10:00:00Z" },
    { id: "p2", content: "Behind the scenes of our latest photoshoot... 📸", engagement: 892, publishedAt: "2026-06-02T14:00:00Z" },
    { id: "p3", content: "Happy Monday! Here's your weekly dose of motivation ✨", engagement: 567, publishedAt: "2026-05-30T09:00:00Z" },
  ],
};

export default function AccountDetailPage() {
  useParams();
  const [activeView, setActiveView] = useState<"overview" | "posts">("overview");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <a href="/accounts" className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
        <ArrowLeft className="h-4 w-4" /> Back to Accounts
      </a>

      {/* Account Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-primary)]/20 text-heading-lg font-bold text-[var(--color-primary-light)]">
            {MOCK_ACCOUNT.displayName[0]}
          </div>
          <div>
            <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">{MOCK_ACCOUNT.displayName}</h1>
            <p className="text-body-sm text-[var(--color-on-dark-soft)]">@{MOCK_ACCOUNT.username} &middot; {PLATFORM_LABELS[MOCK_ACCOUNT.platform]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-caption font-medium ${MOCK_ACCOUNT.isActive ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--color-error)]/10 text-[var(--color-error)]"}`}>
            {MOCK_ACCOUNT.isActive ? "Active" : "Disconnected"}
          </span>
          <button className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
            <Edit3 className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-[var(--color-error)]/30 px-3 py-2 text-button-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Followers</p>
          <p className="mt-1 text-heading-lg font-bold text-[var(--color-on-dark)]">{MOCK_ACCOUNT.stats.followers.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Following</p>
          <p className="mt-1 text-heading-lg font-bold text-[var(--color-on-dark)]">{MOCK_ACCOUNT.stats.following.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Posts</p>
          <p className="mt-1 text-heading-lg font-bold text-[var(--color-on-dark)]">{MOCK_ACCOUNT.stats.posts}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Engagement</p>
          <p className="mt-1 text-heading-lg font-bold text-[var(--color-on-dark)]">{MOCK_ACCOUNT.stats.engagement}%</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 rounded-lg bg-[var(--color-surface-dark-raised)] p-1 w-fit">
        <button
          onClick={() => setActiveView("overview")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-button-sm font-medium ${activeView === "overview" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"}`}
        >
          <Activity className="h-4 w-4" /> Overview
        </button>
        <button
          onClick={() => setActiveView("posts")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-button-sm font-medium ${activeView === "posts" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"}`}
        >
          <BarChart3 className="h-4 w-4" /> Recent Posts
        </button>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        {activeView === "overview" ? (
          <div className="space-y-4">
            <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">Account Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Platform</p>
                <p className="text-body-sm text-[var(--color-on-dark)]">{PLATFORM_LABELS[MOCK_ACCOUNT.platform]}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Username</p>
                <p className="text-body-sm text-[var(--color-on-dark)]">@{MOCK_ACCOUNT.username}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Connected Since</p>
                <p className="text-body-sm text-[var(--color-on-dark)]">{new Date(MOCK_ACCOUNT.connectedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Status</p>
                <p className="text-body-sm text-[var(--color-on-dark)]">{MOCK_ACCOUNT.isActive ? "Active" : "Disconnected"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">Recent Posts</h3>
            {MOCK_ACCOUNT.recentPosts.map((post) => (
              <a
                key={post.id}
                href={`/posts/${post.id}`}
                className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-4 hover:border-[var(--color-ink-soft)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-[var(--color-on-dark)] truncate">{post.content}</p>
                  <span className="text-caption text-[var(--color-on-dark-muted)]">{new Date(post.publishedAt).toLocaleDateString()}</span>
                </div>
                <span className="ml-4 text-caption font-medium text-[var(--color-primary-light)]">{post.engagement.toLocaleString()} eng.</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
