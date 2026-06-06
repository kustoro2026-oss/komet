"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Sparkles, Calendar, Check, ArrowLeft, ArrowRight, Send, Save, Image as ImageIcon, Hash, Type, Loader2, CheckCircle2, AlertCircle, Upload, Trash2, FileVideo } from "lucide-react";
import type { Platform } from "@komet/shared";
import { SUPPORTED_PLATFORMS, PLATFORM_LABELS, CHARACTER_LIMITS } from "@komet/shared";
import { useCreatePost, useProfiles, useAccounts } from "@/lib/zernio/hooks";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePostStore } from "@/stores/post-store";
import { createProfile, getMediaPresignedUrl } from "@/lib/zernio/api";

type ComposerStep = "content" | "platforms" | "schedule" | "review";

interface MediaFile {
  id: string;
  file: File;
  type: "image" | "video";
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  publicUrl?: string;
  error?: string;
}

interface PostForm {
  content: string;
  title: string;
  platforms: Platform[];
  platformOverrides: Partial<Record<Platform, string>>;
  scheduledFor: string;
  scheduledTime: string;
  timezone: string;
  publishNow: boolean;
  media: MediaFile[];
  hashtags: string[];
  tags: string[];
}

export default function CreatePostPage() {
  const [step, setStep] = useState<ComposerStep>("content");
  const [form, setForm] = useState<PostForm>({
    content: "",
    title: "",
    platforms: [],
    platformOverrides: {},
    scheduledFor: "",
    scheduledTime: "09:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    publishNow: true,
    media: [],
    hashtags: [],
    tags: [],
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const composerState = usePostStore((s) => s.composerState);
  const clearComposer = usePostStore((s) => s.clearComposer);
  const composerUsedRef = useRef(false);

  // Convert data URI to File object
  const dataUriToFile = (dataUri: string, filename: string): File => {
    const arr = dataUri.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const uploadMediaFile = useCallback(async (mediaFile: MediaFile) => {
    setForm((prev) => ({
      ...prev,
      media: prev.media.map((m) =>
        m.id === mediaFile.id ? { ...m, status: "uploading" as const, progress: 0 } : m
      ),
    }));

    try {
      const { uploadUrl, publicUrl } = await getMediaPresignedUrl(
        mediaFile.file.name,
        mediaFile.file.type
      );

      // Upload the file directly to the presigned URL
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", mediaFile.file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setForm((prev) => ({
            ...prev,
            media: prev.media.map((m) =>
              m.id === mediaFile.id ? { ...m, progress } : m
            ),
          }));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(mediaFile.file);
      });

      setForm((prev) => ({
        ...prev,
        media: prev.media.map((m) =>
          m.id === mediaFile.id
            ? { ...m, status: "done" as const, progress: 100, publicUrl }
            : m
        ),
      }));
    } catch (err) {
      setForm((prev) => ({
        ...prev,
        media: prev.media.map((m) =>
          m.id === mediaFile.id
            ? {
                ...m,
                status: "error" as const,
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : m
        ),
      }));
    }
  }, []);

  // Pre-fill form with content from AI Studio
  useEffect(() => {
    const incomingContent = composerState.content;
    const incomingMediaUrls = composerState.mediaUrls;
    if ((incomingContent || incomingMediaUrls?.length) && !composerUsedRef.current) {
      composerUsedRef.current = true;

      // Set content
      if (incomingContent) {
        setForm((prev) => ({
          ...prev,
          content: incomingContent,
          hashtags: composerState.hashtags?.length ? composerState.hashtags : prev.hashtags,
          platforms: composerState.platforms?.length ? composerState.platforms : prev.platforms,
        }));
      }

      // Handle media URLs from AI Studio (data URIs) and Media Library (HTTP URLs)
      if (incomingMediaUrls?.length) {
        const processUrls = async () => {
          for (const url of incomingMediaUrls) {
            if (url.startsWith("data:")) {
              // AI-generated image in data URI format
              const file = dataUriToFile(url, `ai-generated-${Date.now()}.png`);
              const mediaFile: MediaFile = {
                id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
                file,
                type: "image",
                status: "pending",
                progress: 0,
              };
              setForm((prev) => ({
                ...prev,
                media: [...prev.media, mediaFile],
              }));
              uploadMediaFile(mediaFile);
            } else if (url.startsWith("http://") || url.startsWith("https://")) {
              // Media Library URL — fetch the file and upload
              try {
                const response = await fetch(url);
                const blob = await response.blob();
                const filename = url.split("/").pop()?.split("?")[0] || `media-${Date.now()}`;
                const file = new File([blob], filename, { type: blob.type || "image/png" });
                const mediaFile: MediaFile = {
                  id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
                  file,
                  type: file.type.startsWith("video/") ? "video" : "image",
                  status: "pending",
                  progress: 0,
                };
                setForm((prev) => ({
                  ...prev,
                  media: [...prev.media, mediaFile],
                }));
                uploadMediaFile(mediaFile);
              } catch (err) {
                console.error("Failed to fetch media URL:", url, err);
              }
            }
          }
        };
        processUrls();
      }

      clearComposer();
    }
  }, [composerState.content, composerState.mediaUrls, clearComposer, uploadMediaFile]);

  const addMediaFiles = useCallback(
    (files: FileList | File[]) => {
      const newMedia: MediaFile[] = Array.from(files).map((file) => {
        const isVideo = file.type.startsWith("video/");
        const mediaFile: MediaFile = {
          id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
          file,
          type: isVideo ? "video" : "image",
          status: "pending",
          progress: 0,
        };
        return mediaFile;
      });

      setForm((prev) => ({
        ...prev,
        media: [...prev.media, ...newMedia],
      }));

      // Start upload for each new file
      newMedia.forEach((m) => uploadMediaFile(m));
    },
    [uploadMediaFile]
  );

  const removeMedia = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      media: prev.media.filter((m) => m.id !== id),
    }));
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addMediaFiles(e.dataTransfer.files);
    }
  };

  const handleFilePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addMediaFiles(e.target.files);
    }
    // Reset so the same file can be picked again
    e.target.value = "";
  };

  const createPostMutation = useCreatePost();
  const { data: profiles } = useProfiles();
  const { data: accounts } = useAccounts();

  // Auto-create default profile if none exists
  const profileId = profiles && profiles.length > 0 ? profiles[0].id : null;

  useEffect(() => {
    if (profiles && profiles.length === 0) {
      createProfile("Default").catch(() => {});
    }
  }, [profiles]);

  const router = useRouter();

  const handleSubmit = async (publishNow: boolean) => {
    if (!profileId) {
      setSubmitError("No profile available. Please create a profile first.");
      setSubmitStatus("error");
      return;
    }

    setSubmitStatus("loading");
    setSubmitError("");

    try {
      const scheduledFor = publishNow
        ? undefined
        : `${form.scheduledFor}T${form.scheduledTime}:00`;

      // Map platform names to {platform, accountId} format
      // Use the first connected account for each selected platform
      const platforms = form.platforms
        .map((p) => {
          const connectedAccount = accounts?.find((a) => a.platform === p && a.isActive);
          if (!connectedAccount) return null;
          return { platform: p, accountId: connectedAccount.id };
        })
        .filter(Boolean) as { platform: string; accountId: string }[];

      if (platforms.length === 0) {
        throw new Error("No connected accounts found for selected platforms. Please connect an account first.");
      }

      await createPostMutation.mutateAsync({
        content: form.content,
        title: form.title || undefined,
        platforms,
        publishNow,
        scheduledFor,
        timezone: form.timezone,
        mediaItems: form.media.filter((m) => m.status === "done").length > 0
          ? form.media
              .filter((m) => m.status === "done" && m.publicUrl)
              .map((m) => ({ type: m.type, url: m.publicUrl! }))
          : undefined,
        hashtags: form.hashtags.length > 0 ? form.hashtags : undefined,
        tags: [useWorkspaceStore.getState().activeWorkspace?.slug].filter(Boolean) as string[] | undefined,
      });

      setSubmitStatus("success");

      setTimeout(() => {
        router.push("/posts");
      }, 1500);
    } catch (err) {
      setSubmitStatus("error");
      setSubmitError(err instanceof Error ? err.message : "Failed to create post");
    }
  };

  const updateField = <K extends keyof PostForm>(
    key: K,
    value: PostForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlatform = (platform: Platform) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const addHashtag = (tag: string) => {
    const clean = tag.replace(/^#/, "").trim();
    if (clean && !form.hashtags.includes(clean)) {
      updateField("hashtags", [...form.hashtags, clean]);
    }
  };

  const removeHashtag = (tag: string) => {
    updateField(
      "hashtags",
      form.hashtags.filter((h) => h !== tag)
    );
  };

  const steps: { key: ComposerStep; label: string; icon: typeof Type }[] = [
    { key: "content", label: "Content", icon: Type },
    { key: "platforms", label: "Platforms", icon: Sparkles },
    { key: "schedule", label: "Schedule", icon: Calendar },
    { key: "review", label: "Review", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const canProceed = () => {
    switch (step) {
      case "content":
        return form.content.trim().length > 0;
      case "platforms":
        return form.platforms.length > 0;
      case "schedule":
        return form.publishNow || (form.scheduledFor && form.scheduledTime);
      default:
        return true;
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Step Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                step === s.key
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                  : currentStepIndex > i
                  ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                  : "bg-[var(--color-surface-dark-raised)] text-[var(--color-on-dark-soft)]"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span>{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-8 ${
                  currentStepIndex >= i
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-ink-muted)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Status Notification */}
      {submitStatus === "success" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
          <div>
            <p className="text-body-sm font-medium text-[var(--color-success)]">
              Post created successfully!
            </p>
            <p className="text-caption text-[var(--color-on-dark-soft)]">
              Redirecting to posts...
            </p>
          </div>
        </div>
      )}
      {submitStatus === "error" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-[var(--color-error)]" />
          <div className="flex-1">
            <p className="text-body-sm font-medium text-[var(--color-error)]">
              Failed to create post
            </p>
            <p className="text-caption text-[var(--color-on-dark-soft)]">
              {submitError}
            </p>
          </div>
          <button
            onClick={() => setSubmitStatus("idle")}
            className="text-caption text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark)]"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        {/* STEP 1: Content */}
        {step === "content" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-heading-lg font-semibold text-[var(--color-on-dark)]">
                What do you want to share?
              </h2>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Write your post content below
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                Title (optional)
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter a title for your post..."
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)]">
                  Content
                </label>
                <span className="text-caption text-[var(--color-on-dark-muted)]">
                  {form.content.length} chars
                </span>
              </div>
              <textarea
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="What's on your mind?"
                rows={8}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y min-h-[200px]"
              />
              {/* Character limits per platform */}
              <div className="mt-2 flex flex-wrap gap-2">
                {SUPPORTED_PLATFORMS.slice(0, 6).map((p) => {
                  const limit = CHARACTER_LIMITS[p];
                  if (!limit) return null;
                  const isOver = form.content.length > limit;
                  return (
                    <span
                      key={p}
                      className={`text-micro ${
                        isOver
                          ? "text-[var(--color-error)]"
                          : "text-[var(--color-on-dark-muted)]"
                      }`}
                    >
                      {PLATFORM_LABELS[p]}: {limit}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="flex items-center gap-2 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                <ImageIcon className="h-4 w-4" />
                Images & Videos
              </label>

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  isDragging
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                    : "border-[var(--color-ink-muted)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-dark-raised)]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/mp4,video/mpeg,video/quicktime,video/webm,video/x-m4v"
                  onChange={handleFilePicker}
                  className="hidden"
                />
                <Upload
                  className={`h-8 w-8 mb-2 ${
                    isDragging ? "text-[var(--color-primary)]" : "text-[var(--color-on-dark-muted)]"
                  }`}
                />
                <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                  Drop files here or click to browse
                </p>
                <p className="mt-1 text-caption text-[var(--color-on-dark-muted)]">
                  Images (JPG, PNG, WebP, GIF) & Videos (MP4, WebM, MOV)
                </p>
              </div>

              {/* Uploaded files list */}
              {form.media.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.media.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]"
                    >
                      {/* Preview */}
                      <div className="relative aspect-square">
                        {item.type === "image" ? (
                          <Image
                            src={URL.createObjectURL(item.file)}
                            alt={item.file.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-dark-raised)]">
                            <FileVideo className="h-8 w-8 text-[var(--color-on-dark-muted)]" />
                          </div>
                        )}
                      </div>

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMedia(item.id);
                          }}
                          className="flex items-center gap-1 rounded-full bg-[var(--color-error)] px-3 py-1.5 text-micro text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-1.5 right-1.5">
                        {item.status === "pending" && (
                          <span className="rounded-full bg-[var(--color-on-dark-muted)] px-2 py-0.5 text-micro text-white">
                            Waiting
                          </span>
                        )}
                        {item.status === "uploading" && (
                          <span className="flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-micro text-white">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {item.progress}%
                          </span>
                        )}
                        {item.status === "done" && (
                          <span className="rounded-full bg-[var(--color-success)] px-2 py-0.5 text-micro text-white">
                            Ready
                          </span>
                        )}
                        {item.status === "error" && (
                          <span
                            className="rounded-full bg-[var(--color-error)] px-2 py-0.5 text-micro text-white"
                            title={item.error}
                          >
                            Error
                          </span>
                        )}
                      </div>

                      {/* File name */}
                      <div className="truncate px-2 py-1 text-micro text-[var(--color-on-dark-muted)]">
                        {item.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hashtags */}
            <div>
              <label className="flex items-center gap-2 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                <Hash className="h-4 w-4" />
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/20 px-3 py-1 text-caption text-[var(--color-primary-light)]"
                  >
                    #{tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="hover:text-[var(--color-error)]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem(
                    "hashtag-input"
                  ) as HTMLInputElement;
                  addHashtag(input.value);
                  input.value = "";
                }}
                className="flex gap-2"
              >
                <input
                  name="hashtag-input"
                  type="text"
                  placeholder="Add a hashtag..."
                  className="flex-1 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 2: Platform Selection */}
        {step === "platforms" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-heading-lg font-semibold text-[var(--color-on-dark)]">
                Select Platforms
              </h2>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Choose where to publish this post
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUPPORTED_PLATFORMS.map((platform) => {
                const isSelected = form.platforms.includes(platform);
                const hasOverride = form.platformOverrides[platform];
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : "border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] hover:border-[var(--color-ink-soft)]"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                          : "border-[var(--color-ink-muted)]"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-[var(--color-on-primary)]" />
                      )}
                    </div>
                    <p className="inline-flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)]">
                      <PlatformIcon platform={platform} className="h-4 w-4" />
                      {PLATFORM_LABELS[platform]}
                    </p>
                    {hasOverride && (
                      <p className="text-micro text-[var(--color-accent)] truncate">
                        Custom content set
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Per-platform custom content */}
            {form.platforms.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  Custom Content (optional)
                </h3>
                {form.platforms.map((platform) => (
                  <div key={platform}>
                    <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                      {PLATFORM_LABELS[platform]} override
                    </label>
                    <textarea
                      value={form.platformOverrides[platform] || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          platformOverrides: {
                            ...prev.platformOverrides,
                            [platform]: e.target.value,
                          },
                        }))
                      }
                      placeholder={`Custom content for ${PLATFORM_LABELS[platform]} (leave empty to use main content)`}
                      rows={3}
                      className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Scheduling */}
        {step === "schedule" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-heading-lg font-semibold text-[var(--color-on-dark)]">
                When to publish?
              </h2>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Choose a schedule or publish immediately
              </p>
            </div>

            {/* Publish Now Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.publishNow}
                onChange={(e) => updateField("publishNow", e.target.checked)}
                className="h-5 w-5 rounded border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <div>
                <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                  Publish Now
                </p>
                <p className="text-caption text-[var(--color-on-dark-soft)]">
                  Post will be published immediately
                </p>
              </div>
            </label>

            {!form.publishNow && (
              <>
                {/* Date */}
                <div>
                  <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={form.scheduledFor}
                    onChange={(e) => updateField("scheduledFor", e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    value={form.scheduledTime}
                    onChange={(e) => updateField("scheduledTime", e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) => updateField("timezone", e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {[
                      "UTC",
                      "America/New_York",
                      "America/Chicago",
                      "America/Denver",
                      "America/Los_Angeles",
                      "Europe/London",
                      "Europe/Berlin",
                      "Asia/Jakarta",
                      "Asia/Singapore",
                      "Asia/Tokyo",
                      "Australia/Sydney",
                      "Pacific/Auckland",
                    ].map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 4: Review & Publish */}
        {step === "review" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-heading-lg font-semibold text-[var(--color-on-dark)]">
                Review & Publish
              </h2>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Double-check everything before publishing
              </p>
            </div>

            {/* Summary Card */}
            <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-4 space-y-4">
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
                  Content Preview
                </p>
                <p className="mt-1 text-body-sm text-[var(--color-on-dark)] whitespace-pre-wrap">
                  {form.content}
                </p>
                {form.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.hashtags.map((h) => (
                      <span
                        key={h}
                        className="text-caption text-[var(--color-primary-light)]"
                      >
                        #{h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-[var(--color-ink-muted)]" />

              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
                  Platforms ({form.platforms.length})
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {form.platforms.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/20 px-2.5 py-0.5 text-caption text-[var(--color-primary-light)]"
                    >
                      <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--color-ink-muted)]" />

              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
                  Schedule
                </p>
                <p className="mt-1 text-body-sm text-[var(--color-on-dark)]">
                  {form.publishNow
                    ? "Publish Now"
                    : `${form.scheduledFor} at ${form.scheduledTime} (${form.timezone})`}
                </p>
              </div>

              {form.media.filter((m) => m.status === "done").length > 0 && (
                <>
                  <div className="h-px bg-[var(--color-ink-muted)]" />
                  <div>
                    <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
                      Media ({form.media.filter((m) => m.status === "done").length} files)
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {form.media
                        .filter((m) => m.status === "done")
                        .map((item) => (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-lg border border-[var(--color-ink-muted)]"
                          >
                            {item.type === "image" ? (
                              <div className="relative aspect-square w-full">
                                <Image
                                  src={URL.createObjectURL(item.file)}
                                  alt={item.file.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="flex aspect-square w-full items-center justify-center bg-[var(--color-surface-dark-raised)]">
                                <FileVideo className="h-6 w-6 text-[var(--color-on-dark-muted)]" />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Validation */}
            <div className="rounded-lg border border-[var(--color-ink-muted)] p-4 space-y-2">
              {form.platforms.map((p) => {
                const limit = CHARACTER_LIMITS[p];
                const content = form.platformOverrides[p] || form.content;
                const isOver = limit ? content.length > limit : false;
                return (
                  <div
                    key={p}
                    className="flex items-center justify-between"
                  >
                    <span className="inline-flex items-center gap-1.5 text-caption text-[var(--color-on-dark-soft)]">
                      <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                    </span>
                    {limit ? (
                      <span
                        className={`text-micro ${
                          isOver
                            ? "text-[var(--color-error)]"
                            : "text-[var(--color-success)]"
                        }`}
                      >
                        {content.length}/{limit}
                        {isOver ? " - OVER LIMIT!" : ""}
                      </span>
                    ) : (
                      <span className="text-micro text-[var(--color-on-dark-muted)]">
                        {content.length} chars
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-[var(--color-ink-muted)] pt-6">
          <div>
            {currentStepIndex > 0 && (
              <button
                onClick={() =>
                  setStep(steps[currentStepIndex - 1].key as ComposerStep)
                }
                className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitStatus === "loading"}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
            >
              {submitStatus === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </button>

            {step !== "review" ? (
              <button
                onClick={() =>
                  setStep(steps[currentStepIndex + 1].key as ComposerStep)
                }
                disabled={!canProceed()}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(form.publishNow)}
                disabled={!canProceed() || submitStatus === "loading"}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-button font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 shadow-glow"
              >
                {submitStatus === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitStatus === "loading"
                  ? "Publishing..."
                  : form.publishNow
                  ? "Publish Now"
                  : "Schedule Post"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
