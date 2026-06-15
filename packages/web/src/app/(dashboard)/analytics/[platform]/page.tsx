"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PlatformIcon } from "@/components/ui/platform-icon";
import {
  ArrowLeft,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Users,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  TrendingUp,
  RefreshCw,
  Activity,
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { useAnalyticsAccounts, useDailyMetrics, useFollowerStats, usePlatformPosts } from "@/lib/analytics/hooks";

// Helper: format large numbers compactly
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function computeDateRange(range: string): { from: string; to: string } | undefined {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  switch (range) {
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return undefined;
  }
  return { from: from.toISOString(), to };
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4 animate-pulse">
      <div className="h-3 w-20 bg-[var(--color-ink-muted)] rounded mb-3" />
      <div className="h-7 w-16 bg-[var(--color-ink-muted)] rounded mb-2" />
      <div className="h-3 w-24 bg-[var(--color-ink-muted)] rounded" />
    </div>
  );
}

export default function PlatformAnalyticsPage() {
  const params = useParams();
  const platform = params.platform as string;
  const [dateRange, setDateRange] = useState("30d");

  const { data: accounts, isLoading: accountsLoading } = useAnalyticsAccounts();
  const { data: platformPosts, isLoading: postsLoading } = usePlatformPosts(platform);
  const { data: followerStats } = useFollowerStats();

  // Find the first connected account for this platform
  const account = useMemo(() => {
    return accounts?.find((a) => a.platform === platform);
  }, [accounts, platform]);

  const dateRangeParam = useMemo(
    () => computeDateRange(dateRange),
    [dateRange]
  );

  // Try daily-metrics API — returns empty data since we use local DB
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: analyticsErrorObj,
  } = useDailyMetrics(account?.id, platform, dateRangeParam);

  // Compute fallback metrics from actual posts
  const fallbackMetrics = useMemo(() => {
    const totalEngagement = platformPosts.reduce(
      (sum, p) => sum + (p.engagement ?? 0),
      0
    );
    const published = platformPosts.filter(
      (p) => p.status === "published" || p.status === "partial"
    );
    return {
      impressions: totalEngagement * 6,
      engagement: totalEngagement,
      likes: Math.round(totalEngagement * 0.45),
      comments: Math.round(totalEngagement * 0.12),
      shares: Math.round(totalEngagement * 0.08),
      followers: account?.followers ?? 0,
      totalPosts: platformPosts.length,
      publishedPosts: published.length,
    };
  }, [platformPosts]);

  // Get follower count from follower-stats API
  const accountFollowerInfo = useMemo(() => {
    if (!followerStats?.accounts || !account) return null;
    return followerStats.accounts.find(
      (a: { accountId: string }) => a.accountId === account.id
    );
  }, [followerStats, account]);

  const isLoading = accountsLoading || postsLoading;
  const platformLabel = PLATFORM_LABELS[platform as Platform] || platform;
  const hasAccount = !!account;

  const useApiData = !!analytics && !analyticsError && !analyticsLoading;
  const showFallback = hasAccount && !analyticsLoading && (analyticsError || !analytics);
  const isNotFound =
    analyticsErrorObj instanceof Error &&
    analyticsErrorObj.message.includes("404");

  // Build the 6 metric cards from whichever data source is available
  const metrics = useApiData
    ? [
        { label: "Impressions", value: fmt(analytics.impressions ?? 0), icon: Eye, color: "text-sky-400" },
        { label: "Engagement", value: fmt(analytics.engagement ?? 0), icon: Heart, color: "text-rose-400" },
        { label: "Likes", value: fmt(analytics.likes ?? 0), icon: TrendingUp, color: "text-pink-400" },
        { label: "Comments", value: fmt(analytics.comments ?? 0), icon: MessageCircle, color: "text-emerald-400" },
        { label: "Shares", value: fmt(analytics.shares ?? 0), icon: Share2, color: "text-violet-400" },
        {
          label: "Followers",
          value: fmt(accountFollowerInfo?.followers ?? analytics.followers ?? 0),
          icon: Users,
          color: "text-amber-400",
        },
      ]
    : showFallback
      ? [
          { label: "Impressions*", value: fmt(fallbackMetrics.impressions), icon: Eye, color: "text-sky-400" },
          { label: "Engagement*", value: fmt(fallbackMetrics.engagement), icon: Heart, color: "text-rose-400" },
          { label: "Likes*", value: fmt(fallbackMetrics.likes), icon: TrendingUp, color: "text-pink-400" },
          { label: "Comments*", value: fmt(fallbackMetrics.comments), icon: MessageCircle, color: "text-emerald-400" },
          { label: "Shares*", value: fmt(fallbackMetrics.shares), icon: Share2, color: "text-violet-400" },
          {
            label: "Posts",
            value: String(fallbackMetrics.totalPosts),
            icon: BarChart3,
            color: "text-amber-400",
          },
        ]
      : [];

  const performanceText = useApiData
    ? analytics.engagement > 0
      ? `${fmt(analytics.engagement)} total engagements this period`
      : "Engagement data will appear here"
    : showFallback && fallbackMetrics.engagement > 0
      ? `${fmt(fallbackMetrics.engagement)} total engagements from ${fallbackMetrics.publishedPosts} posts`
      : "No engagement data yet for this platform";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Analytics
          </Link>
          <h1 className="inline-flex items-center gap-2 font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            <PlatformIcon platform={platform as Platform} className="h-7 w-7" />
            {platformLabel} Analytics
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {hasAccount && (
            <>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
              >
                <Download className="h-4 w-4" /> Export
              </button>
            </>
          )}
        </div>
      </div>

      {!hasAccount ? (
        /* ——— No account connected ——— */
        <div className="relative overflow-hidden rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent" />
          <div className="relative flex flex-col items-center py-24 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 mb-6 ring-1 ring-amber-400/20">
              <AlertTriangle className="h-7 w-7 text-amber-400" />
            </div>
            <p className="text-heading-md font-semibold text-[var(--color-on-dark)]">
              No {platformLabel} account connected
            </p>
            <p className="mt-1.5 text-body-sm text-[var(--color-on-dark-soft)] max-w-md text-center">
              Connect a {platformLabel} account to unlock detailed analytics,
              engagement metrics, and performance insights.
            </p>
            <Link
              href="/accounts/connect"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow transition-all"
            >
              <ExternalLink className="h-4 w-4" /> Connect {platformLabel}
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        /* ——— Loading skeletons ——— */
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[var(--color-ink-muted)]" />
              <div className="flex-1">
                <div className="h-4 w-40 bg-[var(--color-ink-muted)] rounded mb-2" />
                <div className="h-3 w-24 bg-[var(--color-ink-muted)] rounded" />
              </div>
              <div className="h-6 w-16 bg-[var(--color-ink-muted)] rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ——— Account Info Card ——— */}
          <div className="relative overflow-hidden rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/20">
                  <PlatformIcon
                    platform={platform as Platform}
                    className="h-6 w-6 text-[var(--color-primary-light)]"
                  />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                    {account.displayName}
                  </p>
                  <p className="text-caption text-[var(--color-on-dark-soft)]">
                    @{account.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {accountFollowerInfo && (
                  <div className="text-right">
                    <p className="text-heading-sm font-bold text-[var(--color-on-dark)]">
                      {fmt(accountFollowerInfo.followers)}
                    </p>
                    <p className="text-micro text-[var(--color-on-dark-muted)]">
                      Followers
                    </p>
                  </div>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-caption font-medium ${
                    account.isActive
                      ? "bg-[var(--color-success)]/10 text-[var(--color-success)] ring-1 ring-[var(--color-success)]/20"
                      : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] ring-1 ring-[var(--color-warning)]/20"
                  }`}
                >
                  {account.isActive ? "Active" : "Expired"}
                </span>
              </div>
            </div>

            {/* Fallback warning banner */}
            {showFallback && (
              <div className="relative mt-4 flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="min-w-0">
                  <p className="text-caption font-medium text-amber-300">
                    {isNotFound
                      ? "Analytics API not enabled for this plan"
                      : "Analytics temporarily unavailable"}
                  </p>
                  <p className="mt-0.5 text-micro text-[var(--color-on-dark-soft)]">
                    Showing estimated metrics based on your published posts.
                    {isNotFound
                      ? " Upgrade your plan or contact support to enable analytics."
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="ml-auto shrink-0 rounded-md p-1.5 text-amber-400 hover:bg-amber-400/10 transition-colors"
                  title="Retry"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* ——— Metrics Grid ——— */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="group rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4 hover:border-[var(--color-ink-soft)] transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-caption-uppercase text-[var(--color-on-dark-muted)] truncate group-hover:text-[var(--color-on-dark-soft)] transition-colors">
                      {metric.label}
                    </p>
                    <metric.icon
                      className={`h-4 w-4 ${metric.color} shrink-0 opacity-70 group-hover:opacity-100 transition-opacity`}
                    />
                  </div>
                  <p className="font-display text-heading-md font-bold text-[var(--color-on-dark)]">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ——— Charts & Top Posts ——— */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Performance chart area */}
            <div className="lg:col-span-2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  Performance
                </h3>
                <span className="text-micro text-[var(--color-on-dark-muted)]">
                  {dateRange === "7d"
                    ? "Last 7 days"
                    : dateRange === "30d"
                      ? "Last 30 days"
                      : "Last 90 days"}
                </span>
              </div>
              <p className="text-body-sm text-[var(--color-on-dark-soft)]">
                Activity overview for {platformLabel}
              </p>
              <div className="mt-6 flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-surface-dark)] to-[var(--color-surface-dark-raised)] border border-[var(--color-ink-muted)]/50">
                <div className="text-center px-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 mb-4">
                    <Activity className="h-7 w-7 text-[var(--color-primary-light)]" />
                  </div>
                  <p className="text-body-sm text-[var(--color-on-dark)] font-medium">
                    {platformLabel} Performance
                  </p>
                  <p className="mt-1 text-caption text-[var(--color-on-dark-muted)]">
                    {performanceText}
                  </p>
                  {showFallback && (
                    <p className="mt-3 text-micro text-amber-400/70">
                      *Estimated from post data
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Top Posts */}
            <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]">
              <div className="border-b border-[var(--color-ink-muted)] px-5 py-4">
                <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  Top Posts
                </h3>
              </div>
              <div className="divide-y divide-[var(--color-ink-muted)]">
                {platformPosts.length > 0 ? (
                  platformPosts.slice(0, 5).map((post, i) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-surface-dark-raised)] transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 text-micro font-bold text-[var(--color-primary-light)] group-hover:from-[var(--color-primary)]/30 group-hover:to-[var(--color-primary)]/10 transition-all">
                          {i + 1}
                        </span>
                        <p className="text-body-sm text-[var(--color-on-dark)] truncate">
                          {post.content}
                        </p>
                      </div>
                      <span className="ml-4 shrink-0 text-micro font-medium text-[var(--color-primary-light)]">
                        {post.engagement != null
                          ? post.engagement.toLocaleString() + " eng."
                          : "—"}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center py-12 px-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-dark)] mb-4">
                      <BarChart3 className="h-6 w-6 text-[var(--color-on-dark-muted)]" />
                    </div>
                    <p className="text-body-sm text-[var(--color-on-dark-soft)] text-center">
                      No posts on {platformLabel} yet
                    </p>
                    <Link
                      href="/posts/create"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-all"
                    >
                      <ExternalLink className="h-4 w-4" /> Create Post
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
