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
  Loader2,
  AlertTriangle,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { useAccounts, useAccountAnalytics, usePosts } from "@/lib/zernio/hooks";

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

export default function PlatformAnalyticsPage() {
  const params = useParams();
  const platform = params.platform as string;
  const [dateRange, setDateRange] = useState("30d");

  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: postsData, isLoading: postsLoading } = usePosts({ limit: 100 });

  // Find the first connected account for this platform
  const account = useMemo(() => {
    return accounts?.find((a) => a.platform === platform);
  }, [accounts, platform]);

  const dateRangeParam = useMemo(
    () => computeDateRange(dateRange),
    [dateRange]
  );

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
  } = useAccountAnalytics(account?.id, platform, dateRangeParam);

  // Filter posts for this platform
  const platformPosts = useMemo(() => {
    const posts = postsData?.posts ?? [];
    return posts
      .filter((p) => (p.platforms ?? []).includes(platform))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);
  }, [postsData, platform]);

  const isLoading = accountsLoading || postsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
      </div>
    );
  }

  const platformLabel = PLATFORM_LABELS[platform as Platform] || platform;
  const hasAccount = !!account;

  // Metrics from analytics API
  const metrics = analytics
    ? [
        {
          label: "Impressions",
          value: fmt(analytics.impressions ?? 0),
          icon: Eye,
        },
        {
          label: "Engagement",
          value: fmt(analytics.engagement ?? 0),
          icon: Heart,
        },
        {
          label: "Likes",
          value: fmt(analytics.likes ?? 0),
          icon: Heart,
        },
        {
          label: "Comments",
          value: fmt(analytics.comments ?? 0),
          icon: MessageCircle,
        },
        {
          label: "Shares",
          value: fmt(analytics.shares ?? 0),
          icon: Share2,
        },
        {
          label: "Followers",
          value: fmt(analytics.followers ?? 0),
          icon: Users,
        },
      ]
    : [];

  const topPosts = analytics?.topPosts ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Analytics
          </Link>
          <h1 className="mt-2 inline-flex items-center gap-2 font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
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
                className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
              >
                <Download className="h-4 w-4" /> Export
              </button>
            </>
          )}
        </div>
      </div>

      {!hasAccount ? (
        /* No account connected */
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-24">
          <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
          <p className="text-body-md text-[var(--color-on-dark)] font-medium">
            No {platformLabel} account connected
          </p>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Connect a {platformLabel} account to view analytics.
          </p>
          <Link
            href="/accounts/connect"
            className="mt-6 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Connect Account
          </Link>
        </div>
      ) : analyticsLoading ? (
        /* Loading analytics */
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
        </div>
      ) : analyticsError || !analytics ? (
        /* Analytics error */
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-24">
          <AlertTriangle className="h-12 w-12 text-[var(--color-error)] mb-4" />
          <p className="text-body-md text-[var(--color-on-dark)] font-medium">
            Failed to load analytics
          </p>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Analytics data is temporarily unavailable for {platformLabel}.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Account Info Card */}
          <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary)]/20">
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
                {analytics?.followers != null && (
                  <div className="text-right">
                    <p className="text-heading-sm font-bold text-[var(--color-on-dark)]">
                      {fmt(analytics.followers)}
                    </p>
                    <p className="text-micro text-[var(--color-on-dark-muted)]">
                      Followers
                    </p>
                  </div>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-caption font-medium ${
                    account.isActive
                      ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                  }`}
                >
                  {account.isActive ? "Active" : "Expired"}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-caption-uppercase text-[var(--color-on-dark-muted)] truncate">
                    {metric.label}
                  </p>
                  <metric.icon className="h-4 w-4 text-[var(--color-on-dark-muted)] shrink-0" />
                </div>
                <p className="font-display text-heading-md font-bold text-[var(--color-on-dark)]">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Chart / Performance Section */}
            <div className="lg:col-span-2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
              <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Performance Over Time
              </h3>
              <p className="text-body-sm text-[var(--color-on-dark-soft)]">
                Engagement trend for the selected period
              </p>
              <div className="mt-6 flex h-64 items-center justify-center rounded-lg bg-[var(--color-surface-dark)]">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-10 w-10 text-[var(--color-on-dark-muted)]" />
                  <p className="mt-2 text-body-sm text-[var(--color-on-dark)] font-medium">
                    {platformLabel} Performance
                  </p>
                  <p className="text-caption text-[var(--color-on-dark-muted)]">
                    {analytics.engagement > 0
                      ? `${fmt(analytics.engagement)} total engagements in this period`
                      : "Engagement data will appear here"}
                  </p>
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
                {topPosts.length > 0 ? (
                  topPosts.map((post, i) => (
                    <div key={post.id || i} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-micro font-bold text-[var(--color-primary-light)]">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-caption text-[var(--color-on-dark)]">
                            {post.content}
                          </p>
                          <p className="mt-1 text-micro text-[var(--color-primary-light)]">
                            {post.engagement.toLocaleString()} eng.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : platformPosts.length > 0 ? (
                  platformPosts.slice(0, 5).map((post, i) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-caption font-bold text-[var(--color-on-dark-muted)]">
                          #{i + 1}
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
                  <div className="flex flex-col items-center py-12">
                    <BarChart3 className="h-8 w-8 text-[var(--color-on-dark-muted)] mb-3" />
                    <p className="text-body-sm text-[var(--color-on-dark-soft)]">
                      No posts on {platformLabel} yet
                    </p>
                    <Link
                      href="/posts/create"
                      className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
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
