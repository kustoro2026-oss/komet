"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Filter, Search, Calendar, Edit3, Trash2, Send, Copy, Plus } from "lucide-react";
import type { Platform, PostStatus } from "@komet/shared";
import { PLATFORM_LABELS, SUPPORTED_PLATFORMS } from "@komet/shared";
import { useTranslations } from "next-intl";
import { usePosts } from "@/lib/zernio/hooks";

interface PostItem {
  id: string;
  content: string;
  title?: string;
  platforms: Platform[];
  status: PostStatus;
  scheduledFor?: string;
  createdAt: string;
  engagement?: number;
}

const MOCK_POSTS: PostItem[] = [
  { id: "1", content: "Excited to announce our new feature! 🚀 After months of hard work, we're finally launching the most requested feature.", title: "New Feature Launch", platforms: ["twitter", "linkedin", "facebook"], status: "published", createdAt: "2024-06-04T10:00:00Z", engagement: 1234 },
  { id: "2", content: "Behind the scenes of our latest photoshoot... 📸", platforms: ["instagram", "tiktok"], status: "scheduled", scheduledFor: "2024-06-06T09:00:00Z", createdAt: "2024-06-04T08:00:00Z" },
  { id: "3", content: "Weekly thread: What's your favorite productivity tool? Share in the comments! 💬", platforms: ["twitter", "reddit"], status: "draft", createdAt: "2024-06-03T15:00:00Z" },
  { id: "4", content: "We hit 10K followers on Instagram! Thank you all for the support 🙏", platforms: ["instagram", "facebook"], status: "published", createdAt: "2024-06-03T12:00:00Z", engagement: 3456 },
  { id: "5", content: "Check out this amazing tutorial we put together on YouTube", title: "Complete Guide Tutorial", platforms: ["youtube", "twitter", "linkedin"], status: "published", createdAt: "2024-06-02T14:00:00Z", engagement: 8921 },
  { id: "6", content: "Join our webinar next week! We'll be discussing industry trends and best practices.", title: "Webinar Invitation", platforms: ["linkedin", "facebook"], status: "scheduled", scheduledFor: "2024-06-08T18:00:00Z", createdAt: "2024-06-02T09:00:00Z" },
  { id: "7", content: "Happy Monday! Here's your weekly dose of motivation: Never give up on your dreams. The journey is worth it. ✨", platforms: ["twitter", "instagram", "linkedin", "facebook"], status: "draft", createdAt: "2024-06-01T22:00:00Z" },
  { id: "8", content: "Product update v2.4 is now live! New features include improved analytics, better scheduling, and more.", title: "v2.4 Release Notes", platforms: ["twitter", "linkedin"], status: "published", createdAt: "2024-06-01T09:00:00Z", engagement: 567 },
  { id: "9", content: "Behind every great product is a great team. Meet our engineering squad! 👨‍💻👩‍💻", platforms: ["instagram", "linkedin", "facebook"], status: "failed", createdAt: "2024-05-30T16:00:00Z" },
  { id: "10", content: "TikTok tip: Use trending sounds to boost your reach! Here's our monthly playlist 🎵", platforms: ["tiktok", "instagram"], status: "draft", createdAt: "2024-05-29T11:00:00Z" },
];
const FALLBACK_POSTS = MOCK_POSTS;

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  scheduled: "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]",
  publishing: "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]",
  published: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  failed: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
  partial: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
};

export default function PostsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const t = useTranslations("posts");

  const { data: apiPosts } = usePosts();
  const posts = (apiPosts?.posts && apiPosts.posts.length > 0) ? apiPosts.posts : FALLBACK_POSTS;

  const filtered = (posts as PostItem[]).filter((post) => {
    if (search && !post.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    if (platformFilter !== "all" && !post.platforms.includes(platformFilter)) return false;
    return true;
  }).sort((a, b) => {
    const dir = sort === "newest" ? -1 : 1;
    return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("subtitle")}
          </p>
        </div>
        <a
          href="/posts/create"
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow"
        >
          <Plus className="h-4 w-4" />
          {t("createPost")}
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PostStatus | "all")}
          className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="all">{t("allStatus")}</option>
          <option value="draft">{t("draft")}</option>
          <option value="scheduled">{t("scheduled")}</option>
          <option value="published">{t("published")}</option>
          <option value="failed">{t("failed")}</option>
          <option value="publishing">{t("publishing")}</option>
          <option value="partial">{t("partial")}</option>
        </select>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as Platform | "all")}
          className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="all">{t("allPlatforms")}</option>
          {SUPPORTED_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="newest">{t("newestFirst")}</option>
          <option value="oldest">{t("oldestFirst")}</option>
        </select>

        <button className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
          <Filter className="h-4 w-4" />
          {t("moreFilters")}
        </button>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap items-center gap-4 text-caption text-[var(--color-on-dark-soft)]">
        <span>{t("total")}: {posts.length}</span>
        <span className="h-3 w-px bg-[var(--color-ink-muted)]" />
        <span>{t("published")}: {posts.filter((p) => p.status === "published").length}</span>
        <span>{t("scheduled")}: {posts.filter((p) => p.status === "scheduled").length}</span>
        <span>{t("drafts")}: {posts.filter((p) => p.status === "draft").length}</span>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
                <th className="px-5 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)] font-medium">
                  {t("content")}
                </th>
                <th className="px-5 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)] font-medium">
                  {t("platforms")}
                </th>
                <th className="px-5 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)] font-medium">
                  {t("status")}
                </th>
                <th className="px-5 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)] font-medium">
                  {t("date")}
                </th>
                <th className="px-5 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)] font-medium">
                  {t("engagement")}
                </th>
                <th className="px-5 py-3 text-right text-caption-uppercase text-[var(--color-on-dark-muted)] font-medium">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink-muted)]">
              {filtered.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="max-w-sm">
                      <p className="line-clamp-2 text-body-sm text-[var(--color-on-dark)]">
                        {post.content}
                      </p>
                      {post.title && (
                        <p className="mt-0.5 text-caption text-[var(--color-on-dark-muted)]">
                          {post.title}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {post.platforms.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-dark)] px-2 py-0.5 text-micro text-[var(--color-on-dark-soft)]"
                        >
                          <PlatformIcon platform={p} className="h-3 w-3" />
                          {PLATFORM_LABELS[p]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-micro font-medium ${
                        STATUS_COLORS[post.status]
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-caption text-[var(--color-on-dark-soft)]">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.scheduledFor
                        ? new Date(post.scheduledFor).toLocaleDateString()
                        : new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-body-sm text-[var(--color-on-dark)]">
                      {post.engagement?.toLocaleString() || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-on-dark)]" title="Edit">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {post.status === "draft" && (
                        <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)]" title="Publish">
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {post.status === "failed" && (
                        <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-accent)]" title="Duplicate">
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                      <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-error)]" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-body-sm text-[var(--color-on-dark-muted)]">{t("noPostsFound")}</p>
            <a
              href="/posts/create"
              className="mt-3 text-caption font-medium text-[var(--color-primary-light)] hover:underline"
            >
              {t("createFirstPost")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
