"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Search,
  Grid3X3,
  List,
  Trash2,
  Image as ImageIcon,
  Video,
  File,
  Music,
  Check,
  Loader2,
  ImagePlus,
  X,
} from "lucide-react";
import { useMediaStore } from "@/stores/media-store";
import { usePostStore } from "@/stores/post-store";

const TYPE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: File,
};

const TYPE_LABELS: Record<string, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document",
};

export default function MediaPage() {
  const router = useRouter();
  const { items, deleteItems, addItem, incrementUsedIn, isUploading, uploadProgress, setUploading, setUploadProgress } =
    useMediaStore();
  const { setComposerState } = usePostStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const filtered = items.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = () => {
    deleteItems(selected);
    setSelected([]);
  };

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setUploadError("");
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(err.error || `Error ${res.status}`);
        }

        const data = await res.json();
        addItem({
          id: data.media.id,
          name: data.media.name,
          type: data.media.type,
          mimeType: data.media.mimeType,
          size: data.media.size,
          sizeBytes: data.media.sizeBytes,
          publicUrl: data.media.publicUrl,
          key: data.media.key,
          createdAt: data.media.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          usedIn: 0,
        });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
      setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
    }

    setUploading(false);
  }, [addItem, setUploading, setUploadProgress]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
      e.target.value = "";
    }
  }, [handleUpload]);

  const handleUseInPost = useCallback((item: typeof items[0]) => {
    incrementUsedIn(item.id);
    setComposerState({
      mediaUrls: [item.publicUrl],
    });
    router.push("/posts/create");
  }, [incrementUsedIn, setComposerState, router]);

  const getColorClass = (type: string) => {
    switch (type) {
      case "image": return "from-blue-500 to-purple-500";
      case "video": return "from-purple-500 to-pink-500";
      case "audio": return "from-green-500 to-teal-500";
      case "document": return "from-orange-500 to-red-500";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            Media Library
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Upload and manage your images, videos, and files
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <>
              <button
                onClick={handleDelete}
                className="rounded-lg border border-[var(--color-error)]/30 px-3 py-2 text-caption text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5 inline" />
                Delete ({selected.length})
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow transition-all active:scale-95 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? `Uploading ${uploadProgress}%` : "Upload"}
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isUploading ? "pointer-events-none opacity-60" : ""
        } ${
          isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
            : "border-[var(--color-ink-muted)] hover:border-[var(--color-primary)]/50"
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 text-[var(--color-primary)] animate-spin" />
            <p className="mt-3 text-body-sm font-medium text-[var(--color-on-dark)]">
              Uploading files...
            </p>
            <div className="mt-3 mx-auto max-w-xs bg-[var(--color-surface-dark)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-micro text-[var(--color-on-dark-muted)]">
              {uploadProgress}%
            </p>
          </>
        ) : (
          <>
            <Upload className={`mx-auto h-10 w-10 ${isDragging ? "text-[var(--color-primary)]" : "text-[var(--color-on-dark-muted)]"}`} />
            <p className={`mt-3 text-body-sm font-medium ${isDragging ? "text-[var(--color-primary-light)]" : "text-[var(--color-on-dark)]"}`}>
              {isDragging ? "Drop files here" : "Drag & drop files here, or click to browse"}
            </p>
            <p className="mt-1 text-micro text-[var(--color-on-dark-muted)]">
              Supports images, videos, audio, and documents up to 50MB
            </p>
          </>
        )}
        {uploadError && (
          <div className="mt-3 flex items-center justify-center gap-2 text-micro text-[var(--color-error)]">
            <X className="h-3 w-3" />
            {uploadError}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media..."
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] pl-10 pr-4 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-ink-muted)] p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-[var(--color-surface-dark)] text-[var(--color-primary-light)]" : "text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark)]"}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-[var(--color-surface-dark)] text-[var(--color-primary-light)]" : "text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark)]"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => {
            const Icon = TYPE_ICONS[item.type];
            const isSelected = selected.includes(item.id);
            const showPreview = item.type === "image" && item.publicUrl;
            return (
              <div
                key={item.id}
                className={`group relative rounded-xl border overflow-hidden transition-all ${
                  isSelected
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                    : "border-[var(--color-ink-muted)] hover:border-[var(--color-ink-soft)] hover:-translate-y-0.5"
                }`}
              >
                {/* Thumbnail / Preview */}
                <div className={`aspect-square ${showPreview ? "bg-[var(--color-surface-dark)]" : `bg-gradient-to-br ${getColorClass(item.type)}`} flex items-center justify-center relative`}>
                  {showPreview ? (
                    <img
                      src={item.publicUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Icon className="h-12 w-12 text-white/60" />
                  )}

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button
                        className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleUseInPost(item); }}
                        title="Use in post"
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-red-400/30 transition-colors"
                        onClick={(e) => { e.stopPropagation(); deleteItems([item.id]); }}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selection Check */}
                <div
                  onClick={() => toggleSelect(item.id)}
                  className={`absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                      : "border-white/60 bg-black/20"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                </div>

                {/* Info */}
                <div className="p-2.5 bg-[var(--color-surface-dark-elevated)]">
                  <p className="text-micro font-medium text-[var(--color-on-dark)] truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-micro text-[var(--color-on-dark-muted)]">
                      {item.size}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.usedIn > 0 && (
                        <span className="text-micro text-[var(--color-on-dark-muted)]">
                          Used {item.usedIn}x
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUseInPost(item); }}
                        className="text-micro text-[var(--color-accent)] hover:text-[var(--color-primary-light)] transition-colors font-medium"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-ink-muted)]">
                <th className="px-4 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)]">File</th>
                <th className="px-4 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)]">Type</th>
                <th className="px-4 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)]">Size</th>
                <th className="px-4 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)]">Dimensions</th>
                <th className="px-4 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)]">Used In</th>
                <th className="px-4 py-3 text-left text-caption-uppercase text-[var(--color-on-dark-muted)]">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ink-muted)]">
              {filtered.map((item) => {
                const Icon = TYPE_ICONS[item.type];
                const isSelected = selected.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`hover:bg-[var(--color-surface-dark)] transition-colors cursor-pointer ${
                      isSelected ? "bg-[var(--color-primary)]/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getColorClass(item.type)}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-body-sm font-medium text-[var(--color-on-dark)]">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-[var(--color-on-dark-soft)]">{TYPE_LABELS[item.type]}</td>
                    <td className="px-4 py-3 text-body-sm text-[var(--color-on-dark-soft)]">{item.size}</td>
                    <td className="px-4 py-3 text-body-sm text-[var(--color-on-dark-soft)]">{item.dimensions || "-"}</td>
                    <td className="px-4 py-3 text-body-sm text-[var(--color-on-dark-soft)]">{item.usedIn} posts</td>
                    <td className="px-4 py-3 text-body-sm text-[var(--color-on-dark-soft)]">{item.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-primary-light)]"
                          onClick={(e) => { e.stopPropagation(); handleUseInPost(item); }}
                          title="Use in post"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-error)]" onClick={(e) => { e.stopPropagation(); deleteItems([item.id]); }}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && !isUploading && (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/5">
            <ImageIcon className="h-8 w-8 text-[var(--color-primary-light)]" />
          </div>
          <p className="mt-4 text-body-sm font-semibold text-[var(--color-on-dark)]">
            {search ? "No matching media found" : "Your media library is empty"}
          </p>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-muted)]">
            {search
              ? "Try adjusting your search or filters"
              : "Upload images, videos, audio, or documents to get started"}
          </p>
          {!search && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-all"
            >
              <Upload className="h-4 w-4" />
              Upload Media
            </button>
          )}
        </div>
      )}
    </div>
  );
}
