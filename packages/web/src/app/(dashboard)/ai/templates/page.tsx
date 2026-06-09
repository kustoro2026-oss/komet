"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Copy,
  Trash2,
  FileText,
  MessageSquare,
  Hash,
  Image,
} from "lucide-react";

import { KometLogo } from "@/components/ui/komet-logo";

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: "caption" | "thread" | "hashtag" | "image_prompt" | "reply";
  variables: string[];
  usageCount: number;
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  caption: FileText,
  thread: MessageSquare,
  hashtag: Hash,
  image_prompt: Image,
  reply: MessageSquare,
};

const CATEGORY_LABELS: Record<string, string> = {
  caption: "Caption",
  thread: "Thread",
  hashtag: "Hashtag",
  image_prompt: "Image Prompt",
  reply: "Reply",
};

const INITIAL_TEMPLATES: PromptTemplate[] = [
  { id: "1", name: "Product Launch", description: "Announce a new product or feature", prompt: "We're excited to announce {{product}}! {{key_feature}} is now available. Try it today at {{link}}.", category: "caption", variables: ["product", "key_feature", "link"], usageCount: 47 },
  { id: "2", name: "Weekly Tips Thread", description: "Share tips in a thread format", prompt: "Here are {{number}} tips about {{topic}}:\n\n1. {{tip1}}\n2. {{tip2}}\n3. {{tip3}}\n\nWhich one was your favorite?", category: "thread", variables: ["number", "topic", "tip1", "tip2", "tip3"], usageCount: 32 },
  { id: "3", name: "Engagement Hashtags", description: "Generate hashtags for engagement", prompt: "Generate {{count}} hashtags for {{topic}} in {{industry}}. Mix of broad and niche tags.", category: "hashtag", variables: ["count", "topic", "industry"], usageCount: 89 },
  { id: "4", name: "Visual Concept", description: "Describe an image concept", prompt: "Create a {{style}} image featuring {{subject}} with {{color_scheme}} color scheme. Mood: {{mood}}.", category: "image_prompt", variables: ["style", "subject", "color_scheme", "mood"], usageCount: 23 },
  { id: "5", name: "Customer Reply", description: "Respond to customer feedback", prompt: "Thank you for your {{feedback_type}}, {{name}}! We appreciate your input and {{next_step}}.", category: "reply", variables: ["feedback_type", "name", "next_step"], usageCount: 56 },
  { id: "6", name: "Industry News", description: "Share industry updates", prompt: "Big news in {{industry}}: {{headline}}. Here's what this means for {{audience}}: {{insight}}. What are your thoughts?", category: "caption", variables: ["industry", "headline", "audience", "insight"], usageCount: 18 },
];

export default function AiTemplatesPage() {
  const [templates] = useState<PromptTemplate[]>(INITIAL_TEMPLATES);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filtered = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            Prompt Templates
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Save and manage AI prompt templates for quick reuse
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow">
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] pl-10 pr-4 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
          <KometLogo size="lg" className="mx-auto mb-1" />
          <p className="mt-3 text-body-sm text-[var(--color-on-dark-soft)]">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((template) => {
            const Icon = CATEGORY_ICONS[template.category];
            return (
              <div
                key={template.id}
                className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 hover:border-[var(--color-ink-soft)] transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                        {template.name}
                      </h3>
                      <p className="text-micro text-[var(--color-on-dark-soft)]">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-micro text-[var(--color-primary-light)] shrink-0">
                    {CATEGORY_LABELS[template.category]}
                  </span>
                </div>

                <div className="mt-3 rounded-lg bg-[var(--color-surface-dark)] p-3">
                  <p className="text-micro text-[var(--color-on-dark-soft)] font-mono leading-relaxed line-clamp-2">
                    {template.prompt}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((v) => (
                      <span
                        key={v}
                        className="rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-micro text-[var(--color-accent)]"
                      >
                        {'{{'}{v}{'}}'}
                      </span>
                    ))}
                  </div>
                  <span className="text-micro text-[var(--color-on-dark-muted)]">
                    Used {template.usageCount}x
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1 border-t border-[var(--color-ink-muted)] pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)]" title="Use template">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)]" title="Edit">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-error)]" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
