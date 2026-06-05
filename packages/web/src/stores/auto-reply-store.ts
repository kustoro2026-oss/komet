import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Platform } from "@komet/shared";

export interface AutoReplyRule {
  id: string;
  name: string;
  trigger: {
    type: "keyword" | "all" | "specific";
    keywords?: string[];
  };
  reply: string;
  platforms: Platform[];
  source: "comments" | "messages" | "both";
  isActive: boolean;
  createdAt: string;
}

interface AutoReplyState {
  rules: AutoReplyRule[];
  addRule: (rule: AutoReplyRule) => void;
  toggleRule: (id: string) => void;
  deleteRule: (id: string) => void;
  updateRule: (id: string, updates: Partial<AutoReplyRule>) => void;
}

const DEFAULT_RULES: AutoReplyRule[] = [
  { id: "1", name: "Thank You Reply", trigger: { type: "keyword", keywords: ["thanks", "thank you", "thx", "tq"] }, reply: "You're welcome! Glad you enjoyed it. Feel free to reach out if you have any questions! 😊", platforms: ["twitter", "instagram", "facebook"], source: "comments", isActive: true, createdAt: "2024-01-15" },
  { id: "2", name: "Pricing Question", trigger: { type: "keyword", keywords: ["price", "cost", "pricing", "how much", "subscription"] }, reply: "Thanks for your interest! You can check our pricing page at komet.app/pricing for all plan details. Feel free to DM us for custom plans! 🚀", platforms: ["twitter", "instagram", "linkedin", "facebook"], source: "both", isActive: true, createdAt: "2024-01-20" },
  { id: "3", name: "Support Auto-Reply", trigger: { type: "keyword", keywords: ["help", "support", "issue", "problem", "bug", "error"] }, reply: "We're sorry to hear you're having trouble! Our support team has been notified and will get back to you shortly. For urgent issues, please email support@komet.app", platforms: ["twitter", "instagram", "facebook"], source: "messages", isActive: false, createdAt: "2024-02-01" },
  { id: "4", name: "Welcome Message", trigger: { type: "all", keywords: [] }, reply: "Hi! Welcome to Komet! 👋 We help you schedule and manage your social media content across all platforms. How can we help you today?", platforms: ["instagram", "facebook"], source: "messages", isActive: true, createdAt: "2024-02-10" },
  { id: "5", name: "Feature Request", trigger: { type: "keyword", keywords: ["feature request", "suggestion", "idea", "would love", "wish"] }, reply: "Thanks for the suggestion! We love hearing from our community. Our product team reviews all feature requests. Drop your idea in detail and we'll take a look! 💡", platforms: ["twitter", "instagram"], source: "comments", isActive: true, createdAt: "2024-03-01" },
];

export const useAutoReplyStore = create<AutoReplyState>()(
  persist(
    (set) => ({
      rules: DEFAULT_RULES,
      addRule: (rule) =>
        set((state) => ({ rules: [...state.rules, rule] })),
      toggleRule: (id) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
          ),
        })),
      deleteRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        })),
      updateRule: (id, updates) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
    }),
    {
      name: "komet-autoreply",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
