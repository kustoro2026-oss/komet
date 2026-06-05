"use client";

import { useState } from "react";
import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Users,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";

const OVERVIEW_METRICS = [
  { label: "Total Impressions", value: "284.5K", change: "+12.3%", isUp: true, icon: Eye },
  { label: "Engagement", value: "45.2K", change: "+8.1%", isUp: true, icon: Heart },
  { label: "Comments", value: "3.8K", change: "-2.4%", isUp: false, icon: MessageCircle },
  { label: "Shares", value: "12.1K", change: "+23.7%", isUp: true, icon: Share2 },
  { label: "New Followers", value: "1.2K", change: "+15.2%", isUp: true, icon: Users },
  { label: "Engagement Rate", value: "5.8%", change: "+0.9%", isUp: true, icon: TrendingUp },
];

const PLATFORM_METRICS: { platform: Platform; impressions: number; engagement: number; followers: number; change: number }[] = [
  { platform: "twitter", impressions: 89500, engagement: 12400, followers: 12500, change: 3.2 },
  { platform: "instagram", impressions: 72300, engagement: 15600, followers: 10200, change: 5.1 },
  { platform: "facebook", impressions: 52100, engagement: 8900, followers: 8100, change: -1.3 },
  { platform: "tiktok", impressions: 45600, engagement: 17800, followers: 25300, change: 8.7 },
  { platform: "youtube", impressions: 18200, engagement: 4200, followers: 7400, change: 2.4 },
  { platform: "linkedin", impressions: 6800, engagement: 2400, followers: 5400, change: -0.8 },
];

const TOP_POSTS = [
  { id: "1", content: "Excited to announce our new feature! 🚀 After months of hard work...", engagement: 3456, platform: "twitter" as Platform },
  { id: "2", content: "Behind the scenes of our latest photoshoot 📸 Check out the full album...", engagement: 2890, platform: "instagram" as Platform },
  { id: "3", content: "Complete tutorial: How to grow your social media presence in 2024", engagement: 2100, platform: "youtube" as Platform },
  { id: "4", content: "We hit 10K followers on Instagram! Thank you all 🙏", engagement: 1876, platform: "instagram" as Platform },
  { id: "5", content: "Happy Monday! Here's your weekly dose of motivation ✨", engagement: 1543, platform: "twitter" as Platform },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            Analytics
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Track your performance across all platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-lg px-3 py-1.5 text-button-sm ${
                dateRange === range
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                  : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {OVERVIEW_METRICS.map((metric) => (
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
            <span
              className={`inline-flex items-center gap-0.5 text-micro font-medium ${
                metric.isUp ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
              }`}
            >
              {metric.isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {metric.change}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Platform Breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]">
          <div className="border-b border-[var(--color-ink-muted)] px-5 py-4">
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              Platform Performance
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
                  <th className="px-5 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)]">Platform</th>
                  <th className="px-5 py-3 text-right text-caption-uppercase text-[var(--color-on-dark-muted)]">Impressions</th>
                  <th className="px-5 py-3 text-right text-caption-uppercase text-[var(--color-on-dark-muted)]">Engagement</th>
                  <th className="px-5 py-3 text-right text-caption-uppercase text-[var(--color-on-dark-muted)]">Followers</th>
                  <th className="px-5 py-3 text-right text-caption-uppercase text-[var(--color-on-dark-muted)]">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink-muted)]">
                {PLATFORM_METRICS.map((pm) => (
                  <tr key={pm.platform} className="hover:bg-[var(--color-surface-dark-raised)]">
                    <td className="px-5 py-4">
                      <span className="text-body-sm font-medium text-[var(--color-on-dark)]">
                        {PLATFORM_LABELS[pm.platform]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-body-sm text-[var(--color-on-dark)]">
                      {pm.impressions.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right text-body-sm text-[var(--color-on-dark)]">
                      {pm.engagement.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right text-body-sm text-[var(--color-on-dark)]">
                      {pm.followers.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 text-caption font-medium ${
                          pm.change >= 0
                            ? "text-[var(--color-success)]"
                            : "text-[var(--color-error)]"
                        }`}
                      >
                        {pm.change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {pm.change > 0 ? "+" : ""}{pm.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Posts */}
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]">
          <div className="border-b border-[var(--color-ink-muted)] px-5 py-4">
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              Top Posts
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-ink-muted)]">
            {TOP_POSTS.map((post, i) => (
              <div key={post.id} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-micro font-bold text-[var(--color-primary-light)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-caption text-[var(--color-on-dark)]">
                      {post.content}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-micro text-[var(--color-on-dark-muted)]">
                        {PLATFORM_LABELS[post.platform]}
                      </span>
                      <span className="text-micro text-[var(--color-primary-light)]">
                        {post.engagement.toLocaleString()} eng.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
