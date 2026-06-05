"use client";

import { useState, useRef } from "react";
import { Upload, Download, AlertTriangle, Check, X, Loader2 } from "lucide-react";

interface CsvRow {
  content: string;
  scheduledFor: string;
  platforms: string;
  mediaUrls: string;
  tags: string;
  hashtags: string;
  valid: boolean;
  errors: string[];
}

export default function BulkUploadPage() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const parsed: CsvRow[] = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const errors: string[] = [];
        if (!cols[0]) errors.push("Content is required");
        return {
          content: cols[0] || "",
          scheduledFor: cols[1] || "",
          platforms: cols[2] || "",
          mediaUrls: cols[3] || "",
          tags: cols[4] || "",
          hashtags: cols[5] || "",
          valid: errors.length === 0,
          errors,
        };
      });
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setImporting(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setImporting(false);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const downloadTemplate = () => {
    const header = "content,scheduledFor,platforms,mediaUrls,tags,hashtags";
    const sample = '"Excited to announce our new feature!","2026-06-10T09:00:00Z","twitter,instagram,linkedin","https://example.com/image.jpg","product,launch","newfeature,announcement"';
    const blob = new Blob([header + "\n" + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "komet-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter((r) => r.valid).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Bulk Upload</h1>
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">Import multiple posts at once via CSV</p>
      </div>

      {/* Upload Zone */}
      <div className="rounded-xl border-2 border-dashed border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center hover:border-[var(--color-primary)]/50 transition-colors">
        <Upload className="mx-auto h-12 w-12 text-[var(--color-on-dark-muted)]" />
        <h3 className="mt-4 font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">Upload CSV File</h3>
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">Drag and drop or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Select File
          </button>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-4 py-2.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            <Download className="h-4 w-4" /> Download Template
          </button>
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">Preview</h2>
              <span className="rounded-full bg-[var(--color-surface-dark-raised)] px-2.5 py-0.5 text-caption text-[var(--color-on-dark-soft)]">
                {rows.length} rows
              </span>
              <span className="flex items-center gap-1 text-caption text-[var(--color-success)]">
                <Check className="h-3 w-3" /> {validCount} valid
              </span>
              {validCount < rows.length && (
                <span className="flex items-center gap-1 text-caption text-[var(--color-error)]">
                  <X className="h-3 w-3" /> {rows.length - validCount} errors
                </span>
              )}
            </div>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? `Importing... ${progress}%` : `Import ${validCount} Posts`}
            </button>
          </div>

          {importing && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-dark)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--color-ink-muted)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-raised)]">
                  <th className="px-4 py-3 text-caption-uppercase text-[var(--color-on-dark-muted)]">Content</th>
                  <th className="px-4 py-3 text-caption-uppercase text-[var(--color-on-dark-muted)]">Schedule</th>
                  <th className="px-4 py-3 text-caption-uppercase text-[var(--color-on-dark-muted)]">Platforms</th>
                  <th className="px-4 py-3 text-caption-uppercase text-[var(--color-on-dark-muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-[var(--color-ink-muted)] last:border-0">
                    <td className="px-4 py-3 text-body-sm text-[var(--color-on-dark)] max-w-[300px] truncate">{row.content}</td>
                    <td className="px-4 py-3 text-body-sm text-[var(--color-on-dark-soft)]">{row.scheduledFor || "-"}</td>
                    <td className="px-4 py-3 text-body-sm text-[var(--color-on-dark-soft)]">{row.platforms || "-"}</td>
                    <td className="px-4 py-3">
                      {row.valid ? (
                        <span className="flex items-center gap-1 text-caption text-[var(--color-success)]">
                          <Check className="h-3 w-3" /> Valid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-caption text-[var(--color-error)]" title={row.errors.join(", ")}>
                          <AlertTriangle className="h-3 w-3" /> {row.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && (
              <div className="border-t border-[var(--color-ink-muted)] px-4 py-3">
                <p className="text-caption text-[var(--color-on-dark-muted)]">Showing first 10 of {rows.length} rows</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
