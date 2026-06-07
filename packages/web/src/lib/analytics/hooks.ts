"use client";

import { useQuery } from "@tanstack/react-query";

// ===== Query Keys =====
export const ANALYTICS_KEYS = {
  overview: ["analytics", "overview"] as const,
  accounts: ["analytics", "accounts"] as const,
  platformPosts: (platform: string) => ["analytics", "platform-posts", platform] as const,
};

interface Account {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
}

interface PostItem {
  id: string;
  content: string;
  title?: string;
  platforms: string[];
  status: string;
  scheduledFor?: string;
  createdAt: string;
  engagement: number;
  tags?: string[];
}

interface OverviewResponse {
  accounts: Account[];
  posts: PostItem[];
}

// ===== Overview: accounts + posts in one call =====
export function useAnalyticsOverview() {
  return useQuery<OverviewResponse>({
    queryKey: ANALYTICS_KEYS.overview,
    queryFn: async () => {
      const res = await fetch("/api/analytics/overview");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch analytics");
      }
      return res.json();
    },
  });
}

// ===== Accounts only =====
export function useAnalyticsAccounts() {
  return useQuery<Account[]>({
    queryKey: ANALYTICS_KEYS.accounts,
    queryFn: async () => {
      const res = await fetch("/api/analytics/accounts");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch accounts");
      }
      return res.json();
    },
  });
}

// ===== Daily metrics (returns empty data — real platform engagement not available from DB) =====
export function useDailyMetrics(
  _accountId: string | undefined,
  _platform: string,
  _dateRange?: { from: string; to: string }
) {
  return useQuery<{
    impressions: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
    followers: number;
  }>({
    queryKey: ["analytics", "daily-metrics", _accountId, _dateRange],
    queryFn: async () => ({
      impressions: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followers: 0,
    }),
    enabled: !!_accountId,
    staleTime: Infinity,
  });
}

// ===== Follower stats (returns empty data — real follower data not available from DB) =====
export function useFollowerStats() {
  return useQuery<{ accounts: { accountId: string; platform: string; followers: number; growth: number }[] }>({
    queryKey: ["analytics", "follower-stats"],
    queryFn: async () => ({ accounts: [] }),
    staleTime: Infinity,
  });
}

// ===== Platform posts (filtered from overview data) =====
export function usePlatformPosts(platform: string) {
  const overview = useAnalyticsOverview();
  const filteredPosts = (overview.data?.posts ?? [])
    .filter((p) => (p.platforms ?? []).includes(platform))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return {
    data: filteredPosts,
    isLoading: overview.isLoading,
    error: overview.error,
  };
}
