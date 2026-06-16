"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, ChevronRight } from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icon";

interface Board {
  id: string;
  name: string;
  description: string;
  privacy: string;
}

export default function PinterestBoardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get("accountId") || "";

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accountId) {
      setError("No account ID provided");
      setLoading(false);
      return;
    }
    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  async function fetchBoards() {
    try {
      setLoading(true);
      const res = await fetch(`/api/pinterest/boards?accountId=${accountId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch boards (${res.status})`);
      }
      const data = await res.json();
      setBoards(data.boards || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedBoard) return;
    try {
      setSaving(true);
      const res = await fetch("/api/pinterest/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, boardId: selectedBoard }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save board");
      }
      router.push("/accounts?connected=true");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#BD081C]/10">
          <PlatformIcon platform="pinterest" className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-on-dark)]">
          Select a Board
        </h1>
        <p className="mt-2 text-sm text-[var(--color-on-dark-soft)]">
          Choose a default board where your pins will be published. You can change this later.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="mt-3 text-sm text-[var(--color-on-dark-soft)]">Loading your boards...</p>
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--color-on-dark-soft)] mb-4">
            No boards found on your Pinterest account.
          </p>
          <p className="text-xs text-[var(--color-on-dark-muted)] mb-6">
            Create at least one board on Pinterest first, then come back and refresh.
          </p>
          <button
            onClick={fetchBoards}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Refresh boards
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-6">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => setSelectedBoard(board.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  selectedBoard === board.id
                    ? "border-[#BD081C] bg-[#BD081C]/10"
                    : "border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selectedBoard === board.id
                      ? "border-[#BD081C] bg-[#BD081C]"
                      : "border-[var(--color-ink-muted)]"
                  }`}
                >
                  {selectedBoard === board.id && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-on-dark)] truncate">
                    {board.name}
                  </p>
                  {board.description && (
                    <p className="text-xs text-[var(--color-on-dark-muted)] truncate mt-0.5">
                      {board.description}
                    </p>
                  )}
                </div>
                {board.privacy !== "PUBLIC" && (
                  <span className="shrink-0 rounded-full bg-[var(--color-ink-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-on-dark-soft)]">
                    {board.privacy}
                  </span>
                )}
                <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${
                  selectedBoard === board.id ? "text-[#BD081C]" : "text-[var(--color-on-dark-muted)]"
                }`} />
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={!selectedBoard || saving}
            className="w-full rounded-lg bg-[#BD081C] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#a0071a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </>
      )}

      <p className="mt-6 text-center text-xs text-[var(--color-on-dark-muted)]">
        Pinterest requires a board to publish pins. You can change the default board anytime from your account settings.
      </p>
    </div>
  );
}
