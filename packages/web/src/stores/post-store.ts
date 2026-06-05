import { create } from "zustand";
import type { Platform } from "@komet/shared";

export interface DraftPost {
  id: string;
  content: string;
  title?: string;
  platforms: Platform[];
  scheduledFor?: string;
  timezone: string;
  mediaUrls: string[];
  hashtags: string[];
  tags: string[];
  platformOverrides: Partial<Record<Platform, string>>;
  publishNow: boolean;
  createdAt: string;
}

interface PostState {
  drafts: DraftPost[];
  composerState: Partial<DraftPost>;
  addDraft: (draft: DraftPost) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
  setComposerState: (state: Partial<DraftPost>) => void;
  clearComposer: () => void;
}

export const usePostStore = create<PostState>()(
  (set) => ({
    drafts: [],
    composerState: {
      content: "",
      title: "",
      platforms: [],
      platformOverrides: {},
      scheduledFor: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      mediaUrls: [],
      hashtags: [],
      tags: [],
      publishNow: false,
    },
    addDraft: (draft) =>
      set((state) => ({ drafts: [...state.drafts, draft] })),
    removeDraft: (id) =>
      set((state) => ({
        drafts: state.drafts.filter((d) => d.id !== id),
      })),
    clearDrafts: () => set({ drafts: [] }),
    setComposerState: (state) =>
      set((prev) => ({
        composerState: { ...prev.composerState, ...state },
      })),
    clearComposer: () =>
      set({
        composerState: {
          content: "",
          title: "",
          platforms: [],
          platformOverrides: {},
          scheduledFor: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          mediaUrls: [],
          hashtags: [],
          tags: [],
          publishNow: false,
        },
      }),
  })
);
