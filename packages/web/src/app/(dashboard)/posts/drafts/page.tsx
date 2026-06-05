"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Search, Edit3, Trash2, Eye, Calendar } from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";

interface DraftItem {
  id: string;
  content: string;
  title?: string;
  platforms: Platform[];
  updatedAt: string;
}

const MOCK_DRAFTS: DraftItem[] = [
  { id: "d1", content: "Weekly thread: What's your favorite productivity tool? Share in the comments! 💬", title: "Weekly Thread", platforms: ["twitter", "reddit"], updatedAt: "2026-06-03T15:00:00Z" },
  { id: "d2", content: "Happy Monday! Here's your weekly dose of motivation: Never give up on your dreams. ✨", platforms: ["twitter", "instagram", "linkedin", "facebook"], updatedAt: "2026-06-01T22:00:00Z" },
  { id: "d3", content: "TikTok tip: Use trending sounds to boost your reach! Here's our monthly playlist 🎵", platforms: ["tiktok", "instagram"], updatedAt: "2026-05-29T11:00:00Z" },
  { id: "d4", content: "Behind every great product is a great team. Meet our engineering squad! 👨‍💻👩‍💻", title: "Team Spotlight", platforms: ["instagram", "linkedin"], updatedAt: "2026-05-28T16:00:00Z" },
];

export default function DraftsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_DRAFTS.filter((d) =>
    !search || d.content.toLowerCase().includes(search.toLowerCase()) || d.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Drafts</h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {filtered.length} draft{filtered.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <a
          href="/posts/create"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          New Post
        </a>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drafts..."
          className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Drafts List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
            <p className="text-body-md text-[var(--color-on-dark-muted)]">No drafts found</p>
            <a href="/posts/create" className="mt-2 inline-block text-body-sm text-[var(--color-primary-light)] hover:underline">
              Create your first post
            </a>
          </div>
        ) : (
          filtered.map((draft) => (
            <div
              key={draft.id}
              className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 hover:border-[var(--color-ink-soft)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {draft.title && (
                    <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">{draft.title}</h3>
                  )}
                  <p className={`text-body-sm text-[var(--color-on-dark-soft)] ${draft.title ? "mt-1" : ""} line-clamp-2`}>
                    {draft.content}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-caption text-[var(--color-on-dark-muted)]">
                      <Calendar className="h-3 w-3" />
                      {new Date(draft.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1.5">
                      {draft.platforms.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-dark)] px-2 py-0.5 text-micro text-[var(--color-on-dark-muted)]">
                          <PlatformIcon platform={p} className="h-3 w-3" />
                          {PLATFORM_LABELS[p]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <a
                    href={`/posts/${draft.id}`}
                    className="flex items-center gap-1 rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </a>
                  <a
                    href={`/posts/create?draft=${draft.id}`}
                    className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-3 py-1.5 text-caption text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/20"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Continue
                  </a>
                  <button className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-caption text-[var(--color-error)] hover:bg-[var(--color-error)]/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
