import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Platform } from "@komet/shared";

export interface PlatformStatus {
  platform: Platform;
  status: "active" | "expiring" | "inactive";
  followers: string;
}

interface DashboardState {
  totalPosts: number;
  engagement: number;
  connectedAccounts: number;
  scheduledPosts: number;
  platformStatuses: PlatformStatus[];
  incrementPosts: () => void;
  togglePlatformStatus: (platform: Platform) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      totalPosts: 128,
      engagement: 45200,
      connectedAccounts: 8,
      scheduledPosts: 15,
      platformStatuses: [
        { platform: "twitter" as Platform, status: "active" as const, followers: "12.5K" },
        { platform: "instagram" as Platform, status: "active" as const, followers: "10.2K" },
        { platform: "facebook" as Platform, status: "active" as const, followers: "8.1K" },
        { platform: "linkedin" as Platform, status: "expiring" as const, followers: "5.4K" },
        { platform: "tiktok" as Platform, status: "active" as const, followers: "25.3K" },
      ],
      incrementPosts: () =>
        set((state) => ({
          totalPosts: state.totalPosts + 1,
          engagement: state.engagement + Math.floor(Math.random() * 500) + 100,
        })),
      togglePlatformStatus: (platform) =>
        set((state) => ({
          platformStatuses: state.platformStatuses.map((p) =>
            p.platform === platform
              ? {
                  ...p,
                  status: p.status === "active" ? "inactive" : "active" as "active" | "inactive" | "expiring",
                }
              : p
          ),
        })),
    }),
    {
      name: "komet-dashboard",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
