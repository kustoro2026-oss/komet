"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Loader2,
  AlertTriangle,
  Video,
  Music,
  User,
  Clock,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface VideoData {
  id: string;
  title: string;
  cover: string;
  duration: number;
  author: { nickname: string; avatar: string };
  playUrl: string;
  wmPlayUrl: string;
  hdPlayUrl: string;
  musicUrl: string;
}

interface DownloadResult {
  success: boolean;
  error?: string;
  video?: VideoData;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
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

export default function TikTokDownloaderPage() {
  const t = useTranslations("tools");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDownload = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `/api/tool/tiktok-download?url=${encodeURIComponent(trimmed)}`,
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
    if (e.key === "Enter") handleDownload();
  };

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        // Auto-trigger download after paste
        setLoading(true);
        setResult(null);
        try {
          const res = await fetch(
            `/api/tool/tiktok-download?url=${encodeURIComponent(text.trim())}`,
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
      // Clipboard not available — user can type manually
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
            {t("tiktokDownloaderTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-[var(--color-on-dark-soft)] leading-relaxed"
          >
            {t("tiktokDownloaderDesc")}
          </motion.p>
        </div>
      </section>

      {/* Downloader Form */}
      <section className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-xl">
          {/* Input */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("tiktokDownloaderPlaceholder")}
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
                onClick={handleDownload}
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

          {/* Loading state */}
          {loading && (
            <div className="mt-10 flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-on-dark-muted)]">
                {t("tiktokDownloaderLoading")}
              </p>
            </div>
          )}

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && !loading && (
              <motion.div
                key={result.success ? "success" : "error"}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mt-8"
              >
                {!result.success ? (
                  /* Error state */
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
                ) : result.video ? (
                  /* Success state with video card */
                  <div>
                    {/* Video preview card */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] shadow-lg">
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-black/40">
                        {result.video.cover ? (
                          <Image
                            src={result.video.cover}
                            alt={result.video.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Video className="h-12 w-12 text-white/20" />
                          </div>
                        )}
                        {/* Duration badge */}
                        {result.video.duration > 0 && (
                          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
                            <Clock className="h-3 w-3" />
                            {formatDuration(result.video.duration)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        {/* Author */}
                        <div className="flex items-center gap-3 mb-3">
                          {result.video.author.avatar ? (
                            <Image
                              src={result.video.author.avatar}
                              alt=""
                              width={40}
                              height={40}
                              className="rounded-full ring-1 ring-white/10"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04]">
                              <User className="h-5 w-5 text-white/30" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-[var(--color-on-dark)]">
                              {result.video.author.nickname}
                            </p>
                          </div>
                        </div>

                        {/* Title */}
                        <p className="text-sm text-[var(--color-on-dark-soft)] leading-relaxed line-clamp-2">
                          {result.video.title}
                        </p>
                      </div>
                    </div>

                    {/* Download buttons */}
                    <div className="mt-4 space-y-2">
                      {/* No watermark (best quality) */}
                      {result.video.wmPlayUrl && (
                        <button
                          onClick={() =>
                            downloadFile(
                              result.video!.wmPlayUrl,
                              `tiktok-${result.video!.author.nickname}-${result.video!.id}.mp4`,
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-5 py-4 hover:from-[var(--color-primary)]/30 hover:to-[var(--color-primary)]/15 transition-all group"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/20">
                            <Video className="h-5 w-5 text-[var(--color-primary)]" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-sm text-[var(--color-on-dark)]">
                              {t("tiktokDownloaderNoWatermark")}
                            </p>
                            <p className="text-xs text-[var(--color-on-dark-muted)]">
                              {t("tiktokDownloaderBestQuality")}
                            </p>
                          </div>
                          <Download className="h-5 w-5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" />
                        </button>
                      )}

                      {/* HD video */}
                      {result.video.hdPlayUrl &&
                        result.video.hdPlayUrl !== result.video.wmPlayUrl && (
                          <button
                            onClick={() =>
                              downloadFile(
                                result.video!.hdPlayUrl,
                                `tiktok-hd-${result.video!.author.nickname}-${result.video!.id}.mp4`,
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4 hover:bg-white/[0.06] transition-all group"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                              <Video className="h-5 w-5 text-[var(--color-on-dark-soft)]" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-sm text-[var(--color-on-dark)]">
                                {t("tiktokDownloaderHD")}
                              </p>
                              <p className="text-xs text-[var(--color-on-dark-muted)]">
                                {t("tiktokDownloaderHDDesc")}
                              </p>
                            </div>
                            <Download className="h-5 w-5 text-[var(--color-on-dark-soft)] group-hover:scale-110 transition-transform" />
                          </button>
                        )}

                      {/* Audio only */}
                      {result.video.musicUrl && (
                        <button
                          onClick={() =>
                            downloadFile(
                              result.video!.musicUrl,
                              `tiktok-audio-${result.video!.author.nickname}-${result.video!.id}.mp3`,
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4 hover:bg-white/[0.06] transition-all group"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                            <Music className="h-5 w-5 text-[var(--color-on-dark-soft)]" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-sm text-[var(--color-on-dark)]">
                              {t("tiktokDownloaderAudio")}
                            </p>
                            <p className="text-xs text-[var(--color-on-dark-muted)]">
                              {t("tiktokDownloaderAudioDesc")}
                            </p>
                          </div>
                          <Download className="h-5 w-5 text-[var(--color-on-dark-soft)] group-hover:scale-110 transition-transform" />
                        </button>
                      )}

                      {/* Copy link */}
                      <button
                        onClick={() =>
                          handleCopyLink(
                            result.video!.playUrl || result.video!.wmPlayUrl,
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
                            {copied ? t("copied") : t("tiktokDownloaderCopyLink")}
                          </p>
                          <p className="text-xs text-[var(--color-on-dark-muted)]">
                            {t("tiktokDownloaderCopyLinkDesc")}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
            <h3 className="font-semibold text-[var(--color-on-dark)] text-sm mb-3">
              {t("tiktokDownloaderTipsTitle")}
            </h3>
            <ul className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[var(--color-on-dark-soft)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-on-dark-muted)]" />
                  {t(`tiktokDownloaderTip${i}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
