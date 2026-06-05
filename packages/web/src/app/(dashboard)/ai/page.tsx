"use client";

import { useState } from "react";
import {
  Sparkles,
  Zap,
  FileText,
  MessageSquare,
  Image,
  Hash,
  RefreshCw,
  Copy,
  ChevronRight,
} from "lucide-react";

const AI_FEATURES = [
  {
    icon: FileText,
    label: "Generate Post",
    description: "Create engaging social media content from a prompt",
    gradient: "from-[var(--color-primary)] to-[var(--color-accent)]",
  },
  {
    icon: Hash,
    label: "Hashtag Generator",
    description: "Get trending and relevant hashtags for your content",
    gradient: "from-[var(--color-accent)] to-[var(--color-primary)]",
  },
  {
    icon: MessageSquare,
    label: "Rewrite & Adapt",
    description: "Adapt content for different platforms and tones",
    gradient: "from-[var(--color-success)] to-[var(--color-primary)]",
  },
  {
    icon: Image,
    label: "Image Ideas",
    description: "Get visual content suggestions for your posts",
    gradient: "from-[var(--color-warning)] to-[var(--color-accent)]",
  },
];

const GENERATED_POSTS = [
  { id: "1", content: "🚀 Big news! Our latest update brings you smarter analytics, seamless scheduling, and AI-powered content suggestions. The future of social media management is here.", tone: "Professional", platform: "LinkedIn" },
  { id: "2", content: "Just dropped a fresh update with game-changing features! 🎉 Better analytics, easier scheduling, and AI that actually gets you. Check it out! 🔥", tone: "Casual", platform: "Twitter" },
  { id: "3", content: "✨ New Update Alert! We've been working hard to bring you:\n\n📊 Smarter Analytics\n📅 Seamless Scheduling\n🤖 AI Content Assistant\n\nYour social media game just got a serious upgrade!", tone: "Enthusiastic", platform: "Instagram" },
];

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
          AI Content Studio
        </h1>
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
          Generate, rewrite, and optimize your content with AI
        </p>
      </div>

      {/* AI Feature Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AI_FEATURES.map((feature) => (
          <button
            key={feature.label}
            className="group rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4 text-left transition-all hover:border-[var(--color-ink-soft)]"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} text-white`}
            >
              <feature.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-body-sm font-semibold text-[var(--color-on-dark)] group-hover:text-[var(--color-primary-light)] transition-colors">
              {feature.label}
            </p>
            <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
              {feature.description}
            </p>
          </button>
        ))}
      </div>

      {/* AI Generator */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
            Generate Post
          </h2>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
            What do you want to post about?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Announce our new product feature for scheduling social media posts..."
            rows={4}
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-4 py-3 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        {/* Options */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="humorous">Humorous</option>
              <option value="educational">Educational</option>
            </select>
          </div>
          <div>
            <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">Length</label>
            <select className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          <div>
            <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">Platform</label>
            <select className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
              <option value="all">Auto-detect</option>
              <option value="twitter">Twitter / X</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-4 py-2 text-button-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Results */}
      <div>
        <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)] mb-4">
          Generated Content
        </h2>
        <div className="space-y-3">
          {GENERATED_POSTS.map((post) => (
            <div
              key={post.id}
              className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="whitespace-pre-wrap text-body-sm text-[var(--color-on-dark)]">
                    {post.content}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-micro text-[var(--color-primary-light)]">
                      {post.tone}
                    </span>
                    <span className="rounded bg-[var(--color-surface-dark)] px-2 py-0.5 text-micro text-[var(--color-on-dark-muted)]">
                      {post.platform}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)]" title="Copy">
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href="/posts/create"
                    className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-accent)]"
                    title="Use in post"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
