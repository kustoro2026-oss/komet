"use client";

import { useState } from "react";
import {
  Upload,
  Search,
  Grid3X3,
  List,
  Trash2,
  Download,
  Copy,
  Image as ImageIcon,
  Video,
  File,
  Music,
  Check,
} from "lucide-react";
import { useMediaStore } from "@/stores/media-store";

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
  const { items, deleteItems } = useMediaStore();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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
              <button className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-caption text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
                <Download className="h-3.5 w-3.5 mr-1.5 inline" />
                Download
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg border border-[var(--color-error)]/30 px-3 py-2 text-caption text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5 inline" />
                Delete ({selected.length})
              </button>
            </>
          )}
          <button className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow transition-all active:scale-95">
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDragOver={(e) => e.preventDefault()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
            : "border-[var(--color-ink-muted)] hover:border-[var(--color-primary)]/50"
        }`}
      >
        <Upload className={`mx-auto h-10 w-10 ${isDragging ? "text-[var(--color-primary)]" : "text-[var(--color-on-dark-muted)]"}`} />
        <p className={`mt-3 text-body-sm font-medium ${isDragging ? "text-[var(--color-primary-light)]" : "text-[var(--color-on-dark)]"}`}>
          {isDragging ? "Drop files here" : "Drag & drop files here, or click to browse"}
        </p>
        <p className="mt-1 text-micro text-[var(--color-on-dark-muted)]">
          Supports images, videos, audio, and documents up to 50MB
        </p>
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
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                    : "border-[var(--color-ink-muted)] hover:border-[var(--color-ink-soft)] hover:-translate-y-0.5"
                }`}
              >
                {/* Thumbnail */}
                <div className={`aspect-square bg-gradient-to-br ${getColorClass(item.type)} flex items-center justify-center`}>
                  <Icon className="h-12 w-12 text-white/60" />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); }}>
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); deleteItems([item.id]); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Selection Check */}
                {isSelected && (
                  <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}

                {/* Info */}
                <div className="p-2.5 bg-[var(--color-surface-dark-elevated)]">
                  <p className="text-micro font-medium text-[var(--color-on-dark)] truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-micro text-[var(--color-on-dark-muted)]">
                      {item.size}
                    </span>
                    {item.usedIn > 0 && (
                      <span className="text-micro text-[var(--color-on-dark-muted)]">
                        Used {item.usedIn}x
                      </span>
                    )}
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
                        <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)]" onClick={(e) => e.stopPropagation()}><Copy className="h-3.5 w-3.5" /></button>
                        <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)]" onClick={(e) => e.stopPropagation()}><Download className="h-3.5 w-3.5" /></button>
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

      {filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
          <p className="mt-3 text-body-sm text-[var(--color-on-dark-soft)]">No media files found</p>
        </div>
      )}
    </div>
  );
}
