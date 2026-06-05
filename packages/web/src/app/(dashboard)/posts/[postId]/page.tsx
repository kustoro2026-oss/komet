"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { ArrowLeft, Calendar, Clock, Edit3, Eye, History, Save, Send, Trash2, Globe, Check } from "lucide-react";
import type { Platform, PostStatus } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";

const MOCK_POST = {
  id: "1",
  content: "Excited to announce our new feature! 🚀 After months of hard work, we're finally launching the most requested feature. Our team has been working around the clock to bring you something special.",
  title: "New Feature Launch",
  platforms: [
    { platform: "twitter" as Platform, status: "published", publishedUrl: "https://twitter.com/komet/status/1" },
    { platform: "linkedin" as Platform, status: "published", publishedUrl: "https://linkedin.com/feed/1" },
    { platform: "facebook" as Platform, status: "published", publishedUrl: "https://facebook.com/komet/posts/1" },
  ],
  status: "published" as PostStatus,
  scheduledFor: "2026-06-04T10:00:00Z",
  timezone: "Asia/Jakarta",
  hashtags: ["launch", "newfeature", "productupdate"],
  engagement: { likes: 1234, comments: 89, shares: 456 },
  createdAt: "2026-06-01T08:00:00Z",
  updatedAt: "2026-06-04T10:30:00Z",
};

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  scheduled: "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]",
  publishing: "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]",
  published: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  failed: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
  partial: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
};

export default function PostDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "history">("preview");
  const [editContent, setEditContent] = useState(MOCK_POST.content);
  const [editTitle, setEditTitle] = useState(MOCK_POST.title || "");
  const [isEditing, setIsEditing] = useState(false);

  const tabs = [
    { id: "preview" as const, label: "Preview", icon: Eye },
    { id: "edit" as const, label: "Edit", icon: Edit3 },
    { id: "history" as const, label: "History", icon: History },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button */}
      <a
        href="/posts"
        className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Posts
      </a>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
              {MOCK_POST.title || "Untitled Post"}
            </h1>
            <span className={`rounded-full px-2.5 py-0.5 text-caption font-medium ${STATUS_COLORS[MOCK_POST.status]}`}>
              {MOCK_POST.status}
            </span>
          </div>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Post ID: {params.postId} &middot; Created {new Date(MOCK_POST.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            <Edit3 className="h-4 w-4" />
            {isEditing ? "Cancel" : "Edit"}
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[var(--color-error)]/10 px-3 py-2 text-button-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/20">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-[var(--color-surface-dark-raised)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-button-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            <div>
              <p className="text-caption-uppercase text-[var(--color-on-dark-muted)] mb-2">Content</p>
              <p className="text-body-md text-[var(--color-on-dark)] whitespace-pre-wrap">{MOCK_POST.content}</p>
              {MOCK_POST.hashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {MOCK_POST.hashtags.map((h) => (
                    <span key={h} className="text-caption text-[var(--color-primary-light)]">#{h}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-[var(--color-ink-muted)]" />

            <div>
              <p className="text-caption-uppercase text-[var(--color-on-dark-muted)] mb-3">Platforms</p>
              <div className="space-y-2">
                {MOCK_POST.platforms.map((p) => (
                  <div key={p.platform} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-dark)] p-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)]">
                        <PlatformIcon platform={p.platform} className="h-4 w-4" />
                        {PLATFORM_LABELS[p.platform]}
                      </span>
                      {p.publishedUrl ? (
                        <a href={p.publishedUrl} target="_blank" className="flex items-center gap-1 text-caption text-[var(--color-primary-light)] hover:underline">
                          <Globe className="h-3 w-3" /> View
                        </a>
                      ) : null}
                    </div>
                    <span className="flex items-center gap-1 text-caption text-[var(--color-success)]">
                      <Check className="h-3 w-3" /> Published
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--color-ink-muted)]" />

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Likes</p>
                <p className="mt-1 text-heading-md font-bold text-[var(--color-on-dark)]">{MOCK_POST.engagement.likes.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Comments</p>
                <p className="mt-1 text-heading-md font-bold text-[var(--color-on-dark)]">{MOCK_POST.engagement.comments.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Shares</p>
                <p className="mt-1 text-heading-md font-bold text-[var(--color-on-dark)]">{MOCK_POST.engagement.shares.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Schedule</p>
                <p className="mt-1 flex items-center gap-1 text-body-sm text-[var(--color-on-dark)]">
                  <Calendar className="h-3 w-3" />
                  {new Date(MOCK_POST.scheduledFor!).toLocaleDateString()} <Clock className="h-3 w-3 ml-1" />
                  {new Date(MOCK_POST.scheduledFor!).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === "edit" && (
          <div className="space-y-6">
            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">Content</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y min-h-[200px]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-ink-muted)]">
              <button className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
                <Save className="h-4 w-4" /> Save Changes
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]">
                <Send className="h-4 w-4" /> Update & Publish
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <p className="text-body-sm text-[var(--color-on-dark-soft)]">Version history for this post</p>
            {[1, 2, 3].map((v) => (
              <div key={v} className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-caption font-medium text-[var(--color-primary-light)]">
                    v{v}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-[var(--color-on-dark)]">Version {v}</p>
                    <p className="text-caption text-[var(--color-on-dark-muted)]">Saved {v} day{v > 1 ? "s" : ""} ago</p>
                  </div>
                </div>
                <button className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
