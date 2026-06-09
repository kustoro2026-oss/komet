"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Zap,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Hash,
  RefreshCw,
  Copy,
  ChevronRight,
  Check,
  Tags,
  PencilLine,
  Palette,
} from "lucide-react";
import { usePostStore } from "@/stores/post-store";
import { KometLogo } from "@/components/ui/komet-logo";

type FeatureMode = "generate" | "hashtag" | "rewrite" | "image";

interface FeatureConfig {
  mode: FeatureMode;
  icon: typeof FileText;
  label: string;
  description: string;
  gradient: string;
}

interface GeneratedResult {
  id: string;
  content: string;
  mode: FeatureMode;
  imageUrl?: string;
  type?: "text" | "image";
}

export default function AIPage() {
  const t = useTranslations("aiStudio");
  const router = useRouter();
  const setComposerState = usePostStore((s) => s.setComposerState);
  const [mode, setMode] = useState<FeatureMode>("generate");
  const [prompt, setPrompt] = useState("");
  const [rewriteText, setRewriteText] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [platform, setPlatform] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("twitter");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const AI_FEATURES: FeatureConfig[] = [
    {
      mode: "generate",
      icon: FileText,
      label: t("features.generate.label"),
      description: t("features.generate.description"),
      gradient: "from-[var(--color-primary)] to-[var(--color-accent)]",
    },
    {
      mode: "hashtag",
      icon: Hash,
      label: t("features.hashtag.label"),
      description: t("features.hashtag.description"),
      gradient: "from-[var(--color-accent)] to-[var(--color-primary)]",
    },
    {
      mode: "rewrite",
      icon: MessageSquare,
      label: t("features.rewrite.label"),
      description: t("features.rewrite.description"),
      gradient: "from-[var(--color-success)] to-[var(--color-primary)]",
    },
    {
      mode: "image",
      icon: ImageIcon,
      label: t("features.image.label"),
      description: t("features.image.description"),
      gradient: "from-[var(--color-warning)] to-[var(--color-accent)]",
    },
  ];

  const FEATURE_HEADERS: Record<FeatureMode, { title: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = {
    generate: {
      title: t("headers.generate.title"),
      icon: Zap,
      desc: t("headers.generate.desc"),
    },
    hashtag: {
      title: t("headers.hashtag.title"),
      icon: Tags,
      desc: t("headers.hashtag.desc"),
    },
    rewrite: {
      title: t("headers.rewrite.title"),
      icon: PencilLine,
      desc: t("headers.rewrite.desc"),
    },
    image: {
      title: t("headers.image.title"),
      icon: Palette,
      desc: t("headers.image.desc"),
    },
  };

  const EMPTY_MESSAGES: Record<FeatureMode, { line1: string; line2: string }> = {
    generate: {
      line1: t("empty.generate.line1"),
      line2: t("empty.generate.line2"),
    },
    hashtag: {
      line1: t("empty.hashtag.line1"),
      line2: t("empty.hashtag.line2"),
    },
    rewrite: {
      line1: t("empty.rewrite.line1"),
      line2: t("empty.rewrite.line2"),
    },
    image: {
      line1: t("empty.image.line1"),
      line2: t("empty.image.line2"),
    },
  };

  const buildPrompt = (): string => {
    switch (mode) {
      case "hashtag":
        return `Generate 15 trending and relevant hashtags for: ${prompt}. Return them as a comma-separated list grouped by popularity (high, medium, niche). Include brief explanation for each group.`;
      case "rewrite": {
        let instruction = `Rewrite the following content for ${platform || "social media"} with a ${tone} tone. Adapt the length to be ${length}.`;
        if (sourcePlatform) {
          instruction += ` Original platform: ${sourcePlatform}.`;
        }
        return `${instruction}\n\nContent to rewrite:\n${rewriteText}`;
      }
      case "image": {
        const platformStyle = platform ? `in the visual style, aspect ratio, and aesthetic typical of ${platform}` : "in a modern, professional social-media-friendly style";
        return `Create a visually striking, high-quality social media image ${platformStyle}. The topic is: "${prompt}". The image should be clean, eye-catching with good composition, vibrant but tasteful colors, and suitable for marketing purposes.`;
      }
      default:
        return prompt;
    }
  };

  const buildSystemPrompt = (): string => {
    const base = "You are a professional social media content creator.";

    switch (mode) {
      case "hashtag":
        return `${base} Generate relevant, trending hashtags. Return only the hashtags organized by category, no additional explanations. Format as:
🔥 High Volume: #hashtag1, #hashtag2, ...
📈 Medium: #hashtag3, #hashtag4, ...
🎯 Niche: #hashtag5, #hashtag6, ...`;
      case "rewrite": {
        const lengthGuide = {
          short: "1-2 sentences, concise",
          medium: "3-5 sentences, informative",
          long: "6-10 sentences, detailed",
        }[length] || "3-5 sentences, informative";
        const platformGuide = platform
          ? `Optimize for ${platform} platform.`
          : "Make it suitable for social media.";
        return `${base} Rewrite the provided content. Tone: ${tone}. Length: ${lengthGuide}. ${platformGuide} Return only the rewritten content, no explanations.`;
      }
      case "image":
        return `${base} You are a creative visual director. Suggest specific, actionable visual content ideas. Return ideas with clear formatting. Include image type, description, colors, and composition for each idea.`;
      default: {
        const lengthGuide = {
          short: "1-2 sentences, concise",
          medium: "3-5 sentences, informative",
          long: "6-10 sentences, detailed",
        }[length] || "3-5 sentences, informative";
        const platformGuide = platform
          ? `Optimize for ${platform} platform.`
          : "Make it suitable for social media (Twitter, LinkedIn, Instagram, Facebook).";
        return `${base} Generate engaging social media posts. Tone: ${tone}. Length: ${lengthGuide}. ${platformGuide} Return only the post content, no explanations or quotes.`;
      }
    }
  };

  const handleGenerate = async () => {
    const hasInput = mode === "rewrite" ? rewriteText.trim() : prompt.trim();
    if (!hasInput || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPrompt(),
          mode,
          tone,
          length,
          platform: platform || undefined,
          systemPrompt: buildSystemPrompt(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || `Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.content) {
        setResults((prev) => [
          {
            id: `gen-${Date.now()}`,
            content: data.content,
            mode,
            imageUrl: data.imageUrl,
            type: data.type || "text",
          },
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

  const handleUseInPost = (content: string, imageUrl?: string) => {
    setComposerState({
      content,
      ...(imageUrl ? { mediaUrls: [imageUrl] } : {}),
    });
    router.push("/posts/create");
  };

  const header = FEATURE_HEADERS[mode];
  const emptyMsg = EMPTY_MESSAGES[mode];
  const HeaderIcon = header.icon;

  const TONE_OPTIONS: { value: string; label: string }[] = [
    { value: "professional", label: t("tone.professional") },
    { value: "casual", label: t("tone.casual") },
    { value: "enthusiastic", label: t("tone.enthusiastic") },
    { value: "humorous", label: t("tone.humorous") },
    { value: "educational", label: t("tone.educational") },
  ];

  const LENGTH_OPTIONS: { value: string; label: string }[] = [
    { value: "short", label: t("length.short") },
    { value: "medium", label: t("length.medium") },
    { value: "long", label: t("length.long") },
  ];

  const PLATFORM_OPTIONS: { value: string; label: string }[] = [
    { value: "twitter", label: t("platform.twitter") },
    { value: "instagram", label: t("platform.instagram") },
    { value: "linkedin", label: t("platform.linkedin") },
    { value: "facebook", label: t("platform.facebook") },
  ];

  const SOURCE_PLATFORM_OPTIONS: { value: string; label: string }[] = [
    { value: "twitter", label: t("platform.twitter") },
    { value: "instagram", label: t("platform.instagram") },
    { value: "linkedin", label: t("platform.linkedin") },
    { value: "facebook", label: t("platform.facebook") },
    { value: "blog", label: t("sourcePlatform.blog") },
    { value: "email", label: t("sourcePlatform.email") },
    { value: "other", label: t("sourcePlatform.other") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
          {t("heading")}
        </h1>
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
          {t("subtitle")}
        </p>
      </div>

      {/* AI Feature Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AI_FEATURES.map((feature) => {
          const isActive = mode === feature.mode;
          return (
            <button
              key={feature.mode}
              onClick={() => setMode(feature.mode)}
              className={`group rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] hover:border-[var(--color-ink-soft)]"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} text-white`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <p
                className={`mt-3 text-body-sm font-semibold transition-colors ${
                  isActive
                    ? "text-[var(--color-primary-light)]"
                    : "text-[var(--color-on-dark)] group-hover:text-[var(--color-primary-light)]"
                }`}
              >
                {feature.label}
              </p>
              <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
                {feature.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Generator Form */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <HeaderIcon className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
            {header.title}
          </h2>
        </div>

        {/* Mode-specific inputs */}
        {mode === "rewrite" ? (
          <div>
            <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
              {t("form.contentToRewrite")}
            </label>
            <textarea
              value={rewriteText}
              onChange={(e) => setRewriteText(e.target.value)}
              placeholder={t("form.contentPlaceholder")}
              rows={4}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-4 py-3 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
              {header.desc}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === "hashtag"
                  ? t("placeholder.hashtag")
                  : mode === "image"
                    ? t("placeholder.image")
                    : t("placeholder.generate")
              }
              rows={4}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-4 py-3 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>
        )}

        {/* Options */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(mode === "generate" || mode === "rewrite") && (
            <>
              <div>
                <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">{t("form.tone")}</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {TONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">{t("form.length")}</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {LENGTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {(mode === "hashtag" || mode === "image") && (
            <div className="col-span-2">
              <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">{t("form.platformOptional")}</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">{t("form.general")}</option>
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          {(mode === "generate" || mode === "rewrite") && (
            <div>
              <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">{t("form.platform")}</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">{t("form.autoDetect")}</option>
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          {mode === "rewrite" && (
            <div>
              <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">{t("form.sourcePlatform")}</label>
              <select
                value={sourcePlatform}
                onChange={(e) => setSourcePlatform(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {SOURCE_PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          {mode === "generate" && (
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-4 py-2 text-button-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    {t("generate")}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Generate button for non-generate modes */}
        {mode !== "generate" && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={
                (mode === "rewrite" ? !rewriteText.trim() : !prompt.trim()) || isGenerating
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-6 py-2 text-button-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t("generating")}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {t("generate")}
                </>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-4 py-3">
            <p className="text-body-sm text-[var(--color-error)]">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)] mb-4">
          {t("results.heading")}
        </h2>
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-16">
            <KometLogo size="lg" className="mb-3" />
            <p className="text-body-sm text-[var(--color-on-dark-muted)]">{emptyMsg.line1}</p>
            <p className="mt-1 text-caption text-[var(--color-on-dark-muted)]">{emptyMsg.line2}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result) => {
              const feat = AI_FEATURES.find((f) => f.mode === result.mode)!;
              return (
                <div
                  key={result.id}
                  className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4 hover:border-[var(--color-ink-soft)] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br ${feat.gradient} text-white`}>
                      <feat.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-caption font-medium text-[var(--color-on-dark-soft)]">
                      {feat.label}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {result.type === "image" && result.imageUrl ? (
                        <div className="space-y-3">
                          <div className="relative aspect-square max-w-sm rounded-lg overflow-hidden border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
                            <img
                              src={result.imageUrl}
                              alt={result.content}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-caption text-[var(--color-on-dark-soft)] italic">
                            {result.content}
                          </p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-body-sm text-[var(--color-on-dark)] leading-relaxed">
                          {result.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(result.id, result.content)}
                        className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)] transition-colors"
                        title="Copy"
                      >
                        {copiedId === result.id ? (
                          <Check className="h-4 w-4 text-[var(--color-success)]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleUseInPost(result.content, result.imageUrl)}
                        className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-accent)] transition-colors"
                        title="Use in post"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
