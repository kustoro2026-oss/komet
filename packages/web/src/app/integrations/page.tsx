"use client";
import { PageShell } from "@/components/page-shell";
import { motion } from "framer-motion";
import { PlatformIcon } from "@/components/ui/platform-icon";
import type { Platform } from "@komet/shared";

const allPlatforms: { id: Platform; label: string; desc: string }[] = [
  { id: "twitter", label: "Twitter / X", desc: "Post tweets, threads, and polls. Track engagement and follower growth." },
  { id: "instagram", label: "Instagram", desc: "Schedule feed posts, stories, and reels. Monitor comments and DMs." },
  { id: "facebook", label: "Facebook", desc: "Manage pages, groups, and events. Schedule and analyze posts." },
  { id: "youtube", label: "YouTube", desc: "Upload videos, manage playlists, and track viewership analytics." },
  { id: "linkedin", label: "LinkedIn", desc: "Publish articles, posts, and company updates. Professional network analytics." },
  { id: "threads", label: "Threads", desc: "Post threaded conversations. Early access to Threads API features." },
  { id: "tiktok", label: "TikTok", desc: "Schedule short-form videos with trending audio and hashtag suggestions." },
  { id: "pinterest", label: "Pinterest", desc: "Pin images and videos to boards. Schedule and analyze pin performance." },
  { id: "reddit", label: "Reddit", desc: "Post to subreddits, monitor threads, and track community engagement." },
  { id: "bluesky", label: "Bluesky", desc: "Decentralized social networking. Post and interact on the AT Protocol." },
  { id: "telegram", label: "Telegram", desc: "Post to channels and groups. Schedule messages and track member growth." },
  { id: "discord", label: "Discord", desc: "Send announcements, manage server content, and monitor community activity." },
  { id: "snapchat", label: "Snapchat", desc: "Create and schedule Snapchat content. Track story views and engagement." },
  { id: "googlebusiness", label: "Google Business", desc: "Update business profiles, posts, and respond to reviews on Google." },
  { id: "whatsapp", label: "WhatsApp", desc: "Schedule and send business messages via WhatsApp Cloud API." },
];

export default function IntegrationsPage() {
  return (
    <PageShell title="Integrations" description="Connect Komet to 15+ social platforms. One dashboard, every account.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allPlatforms.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="rounded-xl border border-white/[0.08] bg-[var(--color-surface-dark-elevated)] p-4 sm:p-5 hover:border-white/[0.15] transition-all"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <PlatformIcon platform={p.id} className="h-6 w-6 shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-[var(--color-on-dark)]">{p.label}</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}
