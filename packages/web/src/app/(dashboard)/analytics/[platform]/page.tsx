"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, TrendingUp, Download } from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";

const PLATFORM_META: Record<string, { metrics: string[]; color: string }> = {
  instagram: { metrics: ["Impressions", "Reach", "Profile Visits", "Follows", "Engagement", "Stories Views"], color: "#E4405F" },
  twitter: { metrics: ["Impressions", "Profile Visits", "Mentions", "Retweets", "Replies", "Followers"], color: "#1DA1F2" },
  facebook: { metrics: ["Page Likes", "Reach", "Engagement", "Page Views", "Post Clicks"], color: "#1877F2" },
  youtube: { metrics: ["Views", "Watch Time", "Subscribers", "Likes", "Comments", "Shares"], color: "#FF0000" },
  tiktok: { metrics: ["Video Views", "Likes", "Comments", "Shares", "Profile Views", "Followers"], color: "#000000" },
  linkedin: { metrics: ["Impressions", "Clicks", "Reactions", "Comments", "Shares", "Engagement Rate"], color: "#0A66C2" },
};

const PLATFORM_STATS: Record<string, { value: string; change: string; up: boolean }[]> = {
  instagram: [
    { value: "72.3K", change: "+12.5%", up: true },
    { value: "45.8K", change: "+8.2%", up: true },
    { value: "2.1K", change: "+15.3%", up: true },
    { value: "892", change: "+5.7%", up: true },
    { value: "5.2%", change: "+0.8%", up: true },
    { value: "15.6K", change: "+22.1%", up: true },
  ],
};

export default function PlatformAnalyticsPage() {
  const params = useParams();
  const platform = params.platform as string;
  const [dateRange, setDateRange] = useState("30d");

  const meta = PLATFORM_META[platform] || { metrics: ["Impressions", "Engagement", "Followers"], color: "#6366F1" };
  const stats = PLATFORM_STATS[platform] || [
    { value: "0", change: "0%", up: true },
    { value: "0", change: "0%", up: true },
    { value: "0", change: "0%", up: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <a href="/analytics" className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
            <ArrowLeft className="h-4 w-4" /> Back to Analytics
          </a>
          <h1 className="mt-2 font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            {PLATFORM_LABELS[platform as Platform] || platform} Analytics
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {meta.metrics.slice(0, 6).map((metric, i) => {
          const stat = stats[i] || { value: "0", change: "0%", up: true };
          return (
            <div key={metric} className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
              <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{metric}</p>
              <p className="mt-1 text-heading-lg font-bold text-[var(--color-on-dark)]">{stat.value}</p>
              <p className={`mt-1 flex items-center gap-1 text-caption ${stat.up ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
                <TrendingUp className={`h-3 w-3 ${stat.up ? "" : "rotate-180"}`} />
                {stat.change} vs previous period
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart Placeholder */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">Performance Over Time</h3>
        <p className="text-body-sm text-[var(--color-on-dark-soft)]">Engagement trend for the selected period</p>
        <div className="mt-6 flex h-64 items-center justify-center rounded-lg bg-[var(--color-surface-dark)]">
          <div className="text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
            <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">Chart visualization (Recharts)</p>
            <p className="text-caption text-[var(--color-on-dark-muted)]">Available after connecting data source</p>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">Top Performing Posts</h3>
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-dark)] p-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-caption font-bold text-[var(--color-on-dark-muted)]">#{i}</span>
                <p className="text-body-sm text-[var(--color-on-dark)] truncate">Sample top performing post #{i} on {PLATFORM_LABELS[platform as Platform] || platform}</p>
              </div>
              <span className="ml-4 text-caption font-medium text-[var(--color-primary-light)]">{Math.floor(Math.random() * 5000)} eng.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
