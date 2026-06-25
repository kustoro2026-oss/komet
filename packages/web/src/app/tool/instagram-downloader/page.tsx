"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  Video,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  User,
  Layers,
} from "lucide-react";

interface MediaData {
  type: "video" | "image";
  shortcode: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  videoUrl?: string;
  width?: number;
  height?: number;
}

interface DownloadResult {
  success: boolean;
  error?: string;
  media?: MediaData;
  /** Multiple media items for carousel/album posts */
  items?: MediaData[];
}

/** Returns true if post has multiple media items (carousel) */
function isCarousel(result: DownloadResult): boolean {
  return (result.items?.length ?? 0) > 1;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, "_").slice(0, 80);
}

async function downloadFile(url: string, filename: string) {
  const trimmed = url.trim();
  if (!trimmed) return;
  try {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    if (!blob || blob.size === 0) throw new Error("Empty response");
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Fallback: open URL in new tab for direct view
    if (trimmed) window.open(trimmed, "_blank");
  }
}

export default function InstagramDownloaderPage() {
  const t = useTranslations("tools");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFetch = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `/api/tool/instagram-download?url=${encodeURIComponent(trimmed)}`,
      );
      const data: DownloadResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: t("networkError"),
      });
    } finally {
      setLoading(false);
    }
  }, [url, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleFetch();
  };

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setLoading(true);
        setResult(null);
        try {
          const res = await fetch(
            `/api/tool/instagram-download?url=${encodeURIComponent(text.trim())}`,
          );
          const data: DownloadResult = await res.json();
          setResult(data);
        } catch {
          setResult({ success: false, error: t("networkError") });
        } finally {
          setLoading(false);
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

  const isVideo = result?.media?.type === "video";
  const isImage = result?.media?.type === "image";

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
            {t("instagramDownloaderTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-[var(--color-on-dark-soft)] leading-relaxed"
          >
            {t("instagramDownloaderDesc")}
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
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("instagramDownloaderPlaceholder")}
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
                onClick={handleFetch}
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t("download")}
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-10 flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-on-dark-muted)]">
                {t("instagramDownloaderLoading")}
              </p>
            </div>
          )}

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && !loading && (
              <motion.div
                key={result.success ? result.media?.shortcode || "success" : "error"}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mt-8"
              >
                {!result.success ? (
                  /* Error */
                  <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.03] p-6 shadow-lg shadow-amber-500/5">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
                    <div className="relative flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-amber-200 text-sm">
                          {t("downloadError")}
                        </h3>
                        <p className="mt-1.5 text-sm text-amber-300/60 leading-relaxed">
                          {result.error}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : result.media ? (
                  /* Success */
                  <div>
                    {/* Preview card */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] shadow-lg">
                      <div className="relative aspect-square sm:aspect-video bg-black/40">
                        {result.media.thumbnailUrl ? (
                          <Image
                            src={result.media.thumbnailUrl}
                            alt={result.media.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            {isVideo ? (
                              <Video className="h-12 w-12 text-white/20" />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-white/20" />
                            )}
                          </div>
                        )}

                        {/* Type badge */}
                        <span
                          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium backdrop-blur-md ${
                            isVideo
                              ? "bg-purple-500/20 text-purple-200 ring-1 ring-purple-500/20"
                              : "bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/20"
                          }`}
                        >
                          {isVideo ? (
                            <>
                              <Video className="h-3 w-3" />
                              {t("instagramDownloaderReel")}
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-3 w-3" />
                              {t("instagramDownloaderPhoto")}
                            </>
                          )}
                        </span>

                        {/* Resolution badge */}
                        {result.media.width && result.media.height && (
                          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white/80 backdrop-blur-sm">
                            {result.media.width}×{result.media.height}
                          </span>
                        )}

                        {/* Carousel indicator */}
                        {isCarousel(result) && (
                          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white/80 backdrop-blur-sm">
                            <Layers className="h-3 w-3" />
                            {result.items!.length} items
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 ring-1 ring-white/[0.08]">
                            <User className="h-4 w-4 text-purple-300" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[var(--color-on-dark)]">
                              {result.media.author}
                            </p>
                          </div>
                        </div>
                        {result.media.title && (
                          <p className="text-sm text-[var(--color-on-dark-soft)] leading-relaxed line-clamp-3">
                            {result.media.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Carousel items download */}
                    {isCarousel(result) && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-[var(--color-on-dark-muted)] mb-2">
                          Download all {result.items!.length} items:
                        </p>
                        {result.items!.map((item, idx) => (
                          <button
                            key={item.shortcode || idx}
                            onClick={() =>
                              downloadFile(
                                item.videoUrl || item.thumbnailUrl,
                                `instagram-${sanitizeFilename(item.author)}-${item.shortcode || idx}-${idx + 1}.${item.type === "video" ? "mp4" : "jpg"}`,
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 hover:bg-white/[0.06] transition-all group"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                              {item.type === "video" ? (
                                <Video className="h-4 w-4 text-purple-400" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-sky-400" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-xs text-[var(--color-on-dark)]">
                                Item {idx + 1}
                                {item.type === "video" ? " (Video)" : " (Photo)"}
                              </p>
                              <p className="text-xs text-[var(--color-on-dark-muted)]">
                                {item.width && item.height
                                  ? `${item.width}×${item.height}`
                                  : "Original quality"}
                              </p>
                            </div>
                            <Download className="h-4 w-4 text-[var(--color-on-dark-soft)] group-hover:scale-110 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Download buttons */}
                    <div className="mt-4 space-y-2">
                      {/* Video download */}
                      {isVideo && result.media.videoUrl && (
                        <button
                          onClick={() =>
                            downloadFile(
                              result.media!.videoUrl!,
                              `instagram-${sanitizeFilename(result.media!.author)}-${result.media!.shortcode}.mp4`,
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-5 py-4 hover:from-[var(--color-primary)]/30 hover:to-[var(--color-primary)]/15 transition-all group"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/20">
                            <Video className="h-5 w-5 text-[var(--color-primary)]" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-sm text-[var(--color-on-dark)]">
                              {t("instagramDownloaderDownloadVideo")}
                            </p>
                            <p className="text-xs text-[var(--color-on-dark-muted)]">
                              {t("instagramDownloaderBestQuality")}
                            </p>
                          </div>
                          <Download className="h-5 w-5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" />
                        </button>
                      )}

                      {/* Image / Thumbnail download */}
                      {result.media.thumbnailUrl && (
                        <button
                          onClick={() =>
                            downloadFile(
                              result.media!.thumbnailUrl,
                              `instagram-${sanitizeFilename(result.media!.author)}-${result.media!.shortcode}.jpg`,
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4 hover:bg-white/[0.06] transition-all group"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                            <ImageIcon className="h-5 w-5 text-[var(--color-on-dark-soft)]" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-sm text-[var(--color-on-dark)]">
                              {isImage
                                ? t("instagramDownloaderDownloadPhoto")
                                : t("instagramDownloaderDownloadThumbnail")}
                            </p>
                            <p className="text-xs text-[var(--color-on-dark-muted)]">
                              {isImage
                                ? t("instagramDownloaderFullResolution")
                                : t("instagramDownloaderThumbnailDesc")}
                            </p>
                          </div>
                          <Download className="h-5 w-5 text-[var(--color-on-dark-soft)] group-hover:scale-110 transition-transform" />
                        </button>
                      )}

                      {/* Copy link */}
                      <button
                        onClick={() =>
                          handleCopyLink(
                            result.media!.videoUrl || result.media!.thumbnailUrl,
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4 hover:bg-white/[0.06] transition-all group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                          {copied ? (
                            <Check className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <ExternalLink className="h-5 w-5 text-[var(--color-on-dark-soft)]" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm text-[var(--color-on-dark)]">
                            {copied ? t("copied") : t("instagramDownloaderCopyLink")}
                          </p>
                          <p className="text-xs text-[var(--color-on-dark-muted)]">
                            {t("instagramDownloaderCopyLinkDesc")}
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* View on Instagram */}
                    <div className="mt-3 flex justify-center">
                      <a
                        href={`https://www.instagram.com/p/${result.media.shortcode}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark-soft)] transition-colors"
                      >
                        {t("instagramDownloaderViewOnInstagram")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
            <h3 className="font-semibold text-[var(--color-on-dark)] text-sm mb-3">
              {t("instagramDownloaderTipsTitle")}
            </h3>
            <ul className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[var(--color-on-dark-soft)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-on-dark-muted)]" />
                  {t(`instagramDownloaderTip${i}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
