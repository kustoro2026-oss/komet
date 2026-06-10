"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Calendar, Clock, Globe, Sparkles } from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import type { Platform } from "@komet/shared";

interface PlatformSchedule {
  platform: Platform;
  label: string;
  time: string;
  bestTime: string;
  status: "scheduled" | "optimal" | "draft";
  reach: string;
}

interface PostPreview {
  id: string;
  platform: Platform;
  content: string;
  time: string;
  thumbnail: string;
}

const PLATFORM_DATA: PlatformSchedule[] = [
  {
    platform: "instagram",
    label: "Instagram",
    time: "09:00 AM",
    bestTime: "9-11 AM",
    status: "optimal",
    reach: "2.4K",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    time: "12:00 PM",
    bestTime: "12-3 PM",
    status: "scheduled",
    reach: "5.1K",
  },
  {
    platform: "youtube",
    label: "YouTube",
    time: "03:00 PM",
    bestTime: "2-4 PM",
    status: "draft",
    reach: "1.8K",
  },
  {
    platform: "twitter",
    label: "Twitter/X",
    time: "06:00 PM",
    bestTime: "5-7 PM",
    status: "scheduled",
    reach: "890",
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    time: "08:00 AM",
    bestTime: "8-10 AM",
    status: "optimal",
    reach: "3.2K",
  },
  {
    platform: "pinterest",
    label: "Pinterest",
    time: "10:00 PM",
    bestTime: "8-11 PM",
    status: "draft",
    reach: "1.1K",
  },
];

const QUICK_POSTS: PostPreview[] = [
  {
    id: "1",
    platform: "tiktok",
    content: "Behind the scenes of our product launch 🚀",
    time: "12:00 PM",
    thumbnail: "🎬",
  },
  {
    id: "2",
    platform: "instagram",
    content: "New feature drop! Swipe to see the magic ✨",
    time: "09:00 AM",
    thumbnail: "📸",
  },
  {
    id: "3",
    platform: "twitter",
    content: "Thread: 5 lessons from scaling to 10K users 🧵",
    time: "06:00 PM",
    thumbnail: "🐦",
  },
];

function ScheduleTimeline() {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const posts = PLATFORM_DATA.map((p) => ({
    ...p,
    hour: parseInt(p.time.split(":")[0]),
  }));

  return (
    <div className="relative h-40 overflow-x-auto overflow-y-hidden">
      {/* Time labels */}
      <div className="flex h-6 text-[10px] text-[var(--color-on-dark-muted)]">
        {hours.map((h) => (
          <div key={h} className="w-12 shrink-0 text-center">
            {h % 3 === 0 ? `${h}:00` : ""}
          </div>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="relative mt-1 h-0.5 rounded-full bg-white/[0.06]">
        {/* Now marker */}
        <div className="absolute -top-1 left-[30%] h-2 w-0.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]" />
      </div>

      {/* Posts on timeline */}
      <div className="relative mt-2">
        {posts.map((post, i) => (
          <motion.div
            key={post.platform}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="absolute"
            style={{ left: `${(post.hour / 24) * 100}%`, top: `${(i % 3) * 36}px` }}
          >
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] whitespace-nowrap cursor-pointer transition-colors ${
                post.status === "optimal"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : post.status === "scheduled"
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-white/[0.08] bg-white/[0.04] text-[var(--color-on-dark-muted)]"
              }`}
            >
              <PlatformIcon platform={post.platform} className="h-3.5 w-3.5" />
              <span>{post.time}</span>
              <span className="ml-0.5 text-[9px] opacity-60">{post.reach}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function VideoPreview() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-purple-900/40 via-[var(--color-surface-dark)] to-blue-900/40 border border-white/[0.08]">
      {/* Video placeholder with animated gradient */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="relative"
        >
          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-20 w-20 rounded-full border border-[var(--color-primary)]/40"
            />
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.2, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
              className="absolute h-20 w-20 rounded-full border border-purple-400/30"
            />
          </div>

          {/* Play button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="group relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 text-white" />
            ) : (
              <Play className="ml-0.5 h-6 w-6 text-white" />
            )}
          </button>
        </motion.div>
      </div>

      {/* Fake video timeline */}
      <div className="absolute inset-x-4 bottom-3">
        <div className="h-1 rounded-full bg-white/[0.08]">
          <motion.div
            animate={{ width: isPlaying ? "45%" : "15%" }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full bg-[var(--color-primary)]"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/40">
          <span>{isPlaying ? "0:27" : "0:09"}</span>
          <span>1:00</span>
        </div>
      </div>

      {/* Label */}
      <div className="absolute left-3 top-3 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-1 text-[10px] text-white/60 border border-white/[0.06]">
        <Sparkles className="mr-1 inline h-2.5 w-2.5" />
        AI-Generated Preview
      </div>
    </div>
  );
}

function PlatformGrid() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {PLATFORM_DATA.slice(0, 6).map((platform) => (
        <motion.button
          key={platform.platform}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedPlatform(selectedPlatform === platform.platform ? null : platform.platform)}
          className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 sm:p-3 transition-all text-center ${
            selectedPlatform === platform.platform
              ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 shadow-[0_0_12px_var(--color-primary)]/20"
              : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]"
          }`}
        >
          <PlatformIcon platform={platform.platform} className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-[10px] sm:text-xs text-[var(--color-on-dark-soft)]">{platform.label}</span>
          <span
            className={`text-[9px] sm:text-[10px] ${
              platform.status === "optimal"
                ? "text-emerald-400"
                : platform.status === "scheduled"
                  ? "text-blue-400"
                  : "text-[var(--color-on-dark-muted)]"
            }`}
          >
            {platform.status === "optimal" ? "✦ Optimal" : platform.status === "scheduled" ? "✓ Scheduled" : "○ Draft"}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function PostingStats() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Platforms", value: "6", sub: "connected" },
        { label: "Posts", value: "12", sub: "this week" },
        { label: "Est. Reach", value: "14.5K", sub: "total" },
      ].map((stat) => (
        <div key={stat.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-3 text-center">
          <p className="text-sm sm:text-base font-bold text-[var(--color-on-dark)]">{stat.value}</p>
          <p className="text-[9px] sm:text-[10px] text-[var(--color-on-dark-muted)]">{stat.label}</p>
          <p className="text-[8px] sm:text-[9px] text-[var(--color-on-dark-muted)]/60">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

function UpcomingPosts() {
  return (
    <div className="space-y-1.5">
      {QUICK_POSTS.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.08 }}
          className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 hover:border-white/[0.10] transition-all"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-sm">
            {post.thumbnail}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] sm:text-xs text-[var(--color-on-dark)]">{post.content}</p>
            <div className="mt-0.5 flex items-center gap-2 text-[9px] sm:text-[10px] text-[var(--color-on-dark-muted)]">
              <Clock className="h-2.5 w-2.5" />
              {post.time}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function ContentDistributionDashboard() {
  const [activeTab, setActiveTab] = useState<"schedule" | "platforms" | "preview">("schedule");

  const tabs = [
    { id: "schedule" as const, label: "Schedule", icon: Calendar },
    { id: "platforms" as const, label: "Platforms", icon: Globe },
    { id: "preview" as const, label: "Preview", icon: Play },
  ];

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-t-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] sm:text-xs font-medium transition-all ${
                isActive
                  ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                  : "text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark-soft)]"
              }`}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
        <AnimatePresence mode="wait">
          {activeTab === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <VideoPreview />
            </motion.div>
          )}

          {activeTab === "platforms" && (
            <motion.div key="platforms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PlatformGrid />
              <div className="mt-3">
                <PostingStats />
              </div>
            </motion.div>
          )}

          {activeTab === "schedule" && (
            <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScheduleTimeline />
              <div className="mt-4">
                <p className="mb-2 text-[10px] sm:text-xs font-medium text-[var(--color-on-dark-muted)]">
                  Upcoming Posts
                </p>
                <UpcomingPosts />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auto-cycling indicator */}
      <div className="mt-2 flex justify-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-1 rounded-full transition-all ${
              activeTab === tab.id
                ? "w-4 bg-[var(--color-primary)]"
                : "w-1 bg-white/[0.08] hover:bg-white/[0.15]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
