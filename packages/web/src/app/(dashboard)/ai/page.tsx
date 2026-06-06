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
  Check,
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

interface GeneratedPost {
  id: string;
  content: string;
}

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [platform, setPlatform] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          tone,
          length,
          platform: platform || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || `Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.content) {
        setGeneratedPosts((prev) => [
          { id: `gen-${Date.now()}`, content: data.content },
          ...prev,
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
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
            <select
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          <div>
            <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Auto-detect</option>
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

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-4 py-3">
            <p className="text-body-sm text-[var(--color-error)]">{error}</p>
          </div>
        )}
      </div>

      {/* Generated Results */}
      <div>
        <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)] mb-4">
          Generated Content
        </h2>
        {generatedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-16">
            <Sparkles className="h-10 w-10 text-[var(--color-on-dark-muted)] mb-3" />
            <p className="text-body-sm text-[var(--color-on-dark-muted)]">
              Your generated content will appear here
            </p>
            <p className="mt-1 text-caption text-[var(--color-on-dark-muted)]">
              Enter a prompt above and click Generate
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {generatedPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4 hover:border-[var(--color-ink-soft)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="whitespace-pre-wrap text-body-sm text-[var(--color-on-dark)] leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(post.id, post.content)}
                      className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)] transition-colors"
                      title="Copy"
                    >
                      {copiedId === post.id ? (
                        <Check className="h-4 w-4 text-[var(--color-success)]" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <a
                      href="/posts/create"
                      className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-accent)] transition-colors"
                      title="Use in post"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
