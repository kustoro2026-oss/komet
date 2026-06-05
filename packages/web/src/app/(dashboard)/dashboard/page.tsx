"use client";

import { useEffect, useState, useRef } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { TrendingUp, Users, CalendarCheck, BarChart3, Plus, Activity, Clock, Send, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { usePosts, useAccounts, useUsageStats } from "@/lib/zernio/hooks";
import type { PostItem } from "@/lib/zernio/api";

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<number | null>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = performance.now();
    const from = prevValueRef.current;
    prevValueRef.current = value;
    const to = value;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return <>{displayed.toLocaleString()}</>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [countUp, setCountUp] = useState(false);
  const t = useTranslations("dashboard");

  const { data: postsData, isLoading: postsLoading } = usePosts({ limit: 5 });
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: usageData, isLoading: usageLoading } = useUsageStats();

  useEffect(() => {
    setCountUp(true);
  }, []);

  // Compute stats from real data
  const allPosts: PostItem[] = (postsData?.posts ?? []);
  const publishedPosts = allPosts.filter((p) => p.status === "published");
  const scheduledPostsData = allPosts.filter((p) => p.status === "scheduled");
  const draftPosts = allPosts.filter((p) => p.status === "draft");
  const totalEngagement = publishedPosts.reduce((s, p) => s + (p.engagement || 0), 0);
  const allAccounts = accountsData ?? [];

  // Platform statuses derived from real accounts
  const platformStatuses = allAccounts.map((a) => ({
    platform: a.platform as Platform,
    status: a.isActive ? ("active" as const) : ("expiring" as const),
    followers: "0",
  }));

  // Recent posts for sidebar
  const recentPosts = allPosts.slice(0, 5).map((p) => ({
    id: p.id,
    content: p.content,
    platforms: p.platforms as Platform[],
    status: p.status,
    time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
    engagement: p.engagement || 0,
  }));

  // Week overview — compute from post creation dates
  const weekMap: Record<string, { posts: number; engagement: number }> = {};
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  allPosts.forEach((p) => {
    if (p.createdAt) {
      const d = new Date(p.createdAt);
      const label = dayLabels[d.getDay()];
      if (!weekMap[label]) weekMap[label] = { posts: 0, engagement: 0 };
      weekMap[label].posts++;
      weekMap[label].engagement += p.engagement || 0;
    }
  });
  const weekData = dayLabels
    .filter((lbl) => weekMap[lbl])
    .map((lbl) => ({ label: lbl, ...weekMap[lbl] }));
  // If API returns no data, show placeholders
  const displayWeekData = weekData.length > 0 ? weekData : [
    { label: "Mon", posts: 0, engagement: 0 },
    { label: "Tue", posts: 0, engagement: 0 },
    { label: "Wed", posts: 0, engagement: 0 },
    { label: "Thu", posts: 0, engagement: 0 },
  ];

  const isLoading = postsLoading || accountsLoading || usageLoading;

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div className="flex items-center justify-between" variants={item}>
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("welcome")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/posts/create"
            className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] transition-all active:scale-95"
          >
            <Send className="h-4 w-4" />
            {t("quickPost")}
          </a>
          <a
            href="/posts/create"
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            {t("newPost")}
          </a>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <motion.div variants={item} className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
          <span className="ml-3 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("loadingData")}
          </span>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={item}>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:border-[var(--color-primary)]/50 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("postsPublished")}</p>
            <CalendarCheck className="h-5 w-5 text-[var(--color-primary-light)]" />
          </div>
          <p className="mt-2 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
            {countUp ? <AnimatedNumber value={usageData?.postsThisMonth ?? publishedPosts.length} /> : (usageData?.postsThisMonth ?? publishedPosts.length)}
          </p>
          <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">{t("thisMonth")}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:border-[var(--color-success)]/50 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("totalEngagement")}</p>
            <TrendingUp className="h-5 w-5 text-[var(--color-success)]" />
          </div>
          <p className="mt-2 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
            {countUp ? <AnimatedNumber value={totalEngagement} /> : totalEngagement.toLocaleString()}
          </p>
          <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">{t("acrossAllPosts")}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:border-[var(--color-accent)]/50 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("connectedAccounts")}</p>
            <Users className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <p className="mt-2 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
            {usageData?.connectedAccounts ?? allAccounts.length}
          </p>
          <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
            {usageData ? `${usageData.connectedAccounts}/${usageData.accountLimit}` : t("active")}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:border-[var(--color-warning)]/50 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("scheduledPosts")}</p>
            <Clock className="h-5 w-5 text-[var(--color-warning)]" />
          </div>
          <p className="mt-2 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
            {scheduledPostsData.length}
          </p>
          <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
            {draftPosts.length} {t("drafts")}
          </p>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-3" variants={item}>
        {/* Recent Posts */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]">
          <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-5 py-4">
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              {t("recentPosts")}
            </h2>
            <a
              href="/posts"
              className="text-caption font-medium text-[var(--color-primary-light)] hover:underline"
            >
              {t("viewAll")}
            </a>
          </div>
          <div className="divide-y divide-[var(--color-ink-muted)]">
            {recentPosts.length > 0 ? recentPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-[var(--color-surface-dark-raised)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-1 text-body-sm text-[var(--color-on-dark)]">
                    {post.content}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-micro font-medium ${
                        post.status === "published"
                          ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                          : post.status === "scheduled"
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]"
                          : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                      }`}
                    >
                      {post.status}
                    </span>
                    <div className="flex gap-1">
                      {post.platforms.map((p: Platform) => (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 text-micro text-[var(--color-on-dark-muted)]"
                        >
                          <PlatformIcon platform={p} className="h-3 w-3" />
                          {PLATFORM_LABELS[p]}
                        </span>
                      ))}
                    </div>
                    <span className="text-micro text-[var(--color-on-dark-muted)]">
                      {post.time}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {post.engagement > 0 && (
                    <div className="flex items-center gap-1 text-caption text-[var(--color-on-dark-soft)]">
                      <Activity className="h-3 w-3" />
                      {post.engagement.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-body-sm text-[var(--color-on-dark-muted)]">{t("noPostsYet")}</p>
                <a
                  href="/posts/create"
                  className="mt-2 text-caption font-medium text-[var(--color-primary-light)] hover:underline"
                >
                  {t("createFirstPost")}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Account Status */}
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]">
          <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-5 py-4">
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              {t("connectedAccounts")}
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-ink-muted)]">
            {platformStatuses.length > 0 ? platformStatuses.map((item) => (
              <div
                key={item.platform}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-surface-dark-raised)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full transition-colors ${
                      item.status === "active"
                        ? "bg-[var(--color-success)]"
                        : item.status === "expiring"
                        ? "bg-[var(--color-warning)] animate-pulse"
                        : "bg-[var(--color-on-dark-muted)]"
                    }`}
                  />
                  <div>
                    <p className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)]">
                      <PlatformIcon platform={item.platform} className="h-4 w-4" />
                      {PLATFORM_LABELS[item.platform]}
                    </p>
                    <p className="text-micro text-[var(--color-on-dark-muted)]">
                      {item.followers} {t("followers")}
                    </p>
                  </div>
                </div>
                <div>
                  {item.status === "expiring" ? (
                    <span className="text-micro text-[var(--color-warning)]">
                      {t("reconnect")}
                    </span>
                  ) : (
                    <span className={`text-micro capitalize ${
                      item.status === "active" ? "text-[var(--color-success)]" : "text-[var(--color-on-dark-muted)]"
                    }`}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-body-sm text-[var(--color-on-dark-muted)]">{t("noAccountsConnected")}</p>
              </div>
            )}
          </div>
          <div className="border-t border-[var(--color-ink-muted)] px-5 py-3">
            <a
              href="/accounts/connect"
              className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-ink-muted)] py-2 text-caption font-medium text-[var(--color-primary-light)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("connectAccount")}
            </a>
          </div>
        </div>
      </motion.div>

      {/* Quick Analytics */}
      <motion.div
        className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5"
        variants={item}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
            {t("weekOverview")}
          </h2>
          <BarChart3 className="h-5 w-5 text-[var(--color-on-dark-muted)]" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {displayWeekData.map((day) => (
            <div
              key={day.label}
              className="rounded-lg bg-[var(--color-surface-dark)] p-3 transition-all hover:bg-[var(--color-surface-dark-raised)]"
            >
              <p className="text-caption text-[var(--color-on-dark-muted)]">{day.label}</p>
              <div className="mt-2 space-y-1">
                <p className="font-display text-heading-sm font-bold text-[var(--color-on-dark)]">
                  {day.posts}
                </p>
                <p className="flex items-center justify-center gap-1 text-micro text-[var(--color-on-dark-soft)]">
                  <Activity className="h-3 w-3" />
                  {day.engagement}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
