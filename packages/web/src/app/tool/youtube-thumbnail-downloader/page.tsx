"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Play,
} from "lucide-react";

interface ThumbnailVariant {
  label: string;
  quality: string;
  width: number;
  height: number;
}

interface ThumbnailResult {
  videoId: string;
  title?: string;
  variants: ThumbnailVariant[];
  baseUrl: string;
}

const RESOLUTIONS: ThumbnailVariant[] = [
  { label: "Max HD", quality: "maxresdefault", width: 1280, height: 720 },
  { label: "Standard", quality: "sddefault", width: 640, height: 480 },
  { label: "High", quality: "hqdefault", width: 480, height: 360 },
  { label: "Medium", quality: "mqdefault", width: 320, height: 180 },
  { label: "Default", quality: "default", width: 120, height: 90 },
];

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
function extractYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();

  // youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  );
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=VIDEO_ID
  // youtube.com/embed/VIDEO_ID
  // youtube.com/shorts/VIDEO_ID
  // youtube.com/v/VIDEO_ID
  const longMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)([a-zA-Z0-9_-]{11})/,
  );
  if (longMatch) return longMatch[1];

  // youtu.be/VIDEO_ID?si=... or youtube.com/watch?v=VIDEO_ID&...
  const cleanMatch = trimmed.match(
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  );
  if (cleanMatch) return cleanMatch[1];

  // Standalone 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return null;
}

function getThumbnailUrl(videoId: string, quality: string): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Not found");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}

export default function YouTubeThumbnailDownloaderPage() {
  const t = useTranslations("tools");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ThumbnailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError(t("youtubeThumbnailErrorEmpty"));
      setResult(null);
      return;
    }

    const videoId = extractYouTubeVideoId(trimmed);
    if (!videoId) {
      setError(t("youtubeThumbnailErrorInvalid"));
      setResult(null);
      return;
    }

    setError(null);
    setResult({
      videoId,
      variants: RESOLUTIONS,
      baseUrl: `https://img.youtube.com/vi/${videoId}`,
    });
  }, [url, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleParse();
  };

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        const videoId = extractYouTubeVideoId(text);
        if (videoId) {
          setError(null);
          setResult({
            videoId,
            variants: RESOLUTIONS,
            baseUrl: `https://img.youtube.com/vi/${videoId}`,
          });
        } else {
          setError(t("youtubeThumbnailErrorInvalid"));
          setResult(null);
        }
      }
    } catch {
      // Clipboard not available
    }
  }, [t]);

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const previewUrl =
    result && result.videoId
      ? getThumbnailUrl(result.videoId, "maxresdefault")
      : "";

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-white/[0.06] px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-on-dark)]"
          >
            {t("youtubeThumbnailTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-[var(--color-on-dark-soft)] leading-relaxed"
          >
            {t("youtubeThumbnailDesc")}
          </motion.p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-xl">
          {/* Input */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setResult(null);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("youtubeThumbnailPlaceholder")}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-4 px-5 text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] outline-none focus:border-[var(--color-primary)]/40 focus:bg-white/[0.05] transition-all text-sm sm:text-base"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePaste}
                className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[var(--color-on-dark-soft)] hover:bg-white/[0.06] hover:text-[var(--color-on-dark)] transition-all"
              >
                <Copy className="h-4 w-4" />
                {t("paste")}
              </button>
              <button
                onClick={handleParse}
                disabled={!url.trim()}
                className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ImageIcon className="h-4 w-4" />
                {t("youtubeThumbnailFetch")}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-5"
              >
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.03] p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                    <p className="text-sm text-amber-300/70 leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && !error && (
              <motion.div
                key={result.videoId}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mt-8"
              >
                {/* Preview */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] shadow-lg">
                  {/* Thumbnail preview */}
                  <div className="relative aspect-video bg-black/40">
                    {previewUrl && (
                      <Image
                        src={previewUrl}
                        alt={`YouTube video ${result.videoId}`}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          // Maxresdefault might not exist; try hqdefault
                          const target = e.currentTarget;
                          if (target.src.includes("maxresdefault")) {
                            target.src = getThumbnailUrl(
                              result.videoId,
                              "hqdefault",
                            );
                          }
                        }}
                      />
                    )}
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06] rounded-2xl pointer-events-none" />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/20">
                        <Play className="h-6 w-6 text-red-500 fill-red-500" />
                      </div>
                    </div>
                  </div>

                  {/* Video ID + link */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--color-on-dark-muted)] font-mono">
                        {result.videoId}
                      </p>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${result.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("youtubeThumbnailViewOnYouTube")}
                    </a>
                  </div>
                </div>

                {/* Download options */}
                <div className="mt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)]">
                    {t("youtubeThumbnailChooseQuality")}
                  </h3>
                  <div className="space-y-2">
                    {result.variants.map((variant) => {
                      const url = getThumbnailUrl(
                        result.videoId,
                        variant.quality,
                      );
                      return (
                        <div
                          key={variant.quality}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-all group"
                        >
                          {/* Mini preview */}
                          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black/30">
                            <Image
                              src={url}
                              alt={`${variant.label}`}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                const target = e.currentTarget;
                                if (target.src.includes(variant.quality) && variant.quality !== "hqdefault") {
                                  target.src = getThumbnailUrl(
                                    result.videoId,
                                    "hqdefault",
                                  );
                                }
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[var(--color-on-dark)]">
                              {variant.label}
                            </p>
                            <p className="text-xs text-[var(--color-on-dark-muted)]">
                              {variant.width}×{variant.height}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                downloadImage(
                                  url,
                                  `youtube-thumbnail-${result.videoId}-${variant.quality}.jpg`,
                                )
                              }
                              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)]/15 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25 transition-all"
                              title={t("download")}
                            >
                              <Download className="h-3.5 w-3.5" />
                              {t("download")}
                            </button>
                            <button
                              onClick={() => handleCopyLink(url)}
                              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/[0.06] transition-all"
                              title={copied ? t("copied") : t("youtubeThumbnailCopyLink")}
                            >
                              {copied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-[var(--color-on-dark-muted)]" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
            <h3 className="font-semibold text-[var(--color-on-dark)] text-sm mb-3">
              {t("youtubeThumbnailTipsTitle")}
            </h3>
            <ul className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[var(--color-on-dark-soft)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-on-dark-muted)]" />
                  {t(`youtubeThumbnailTip${i}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
