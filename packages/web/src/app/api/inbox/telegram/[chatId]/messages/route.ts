// API Route: Telegram Inbox — Messages
// GET /api/inbox/telegram/[chatId]/messages — Fetch messages from a specific chat
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export const dynamic = "force-dynamic";

const TELEGRAM_API_ID = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || "";

interface ChatMessage {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  isRead: boolean;
  hasMedia: boolean;
  mediaType: string | null;
  mediaData: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } },
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
      return NextResponse.json({ error: "Telegram API not configured" }, { status: 500 });
    }

    const { chatId } = params;
    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    // Find user's active Telegram account
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const account = await prisma.socialAccount.findFirst({
      where: {
        platform: "telegram",
        isActive: true,
        profile: { workspace: { ownerId: user.id } },
      } as any,
      select: { id: true, accessToken: true },
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!account || !account.accessToken) {
      return NextResponse.json({ messages: [] });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);

    const stringSession = new StringSession(account.accessToken);
    const client = new TelegramClient(stringSession, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
      connectionRetries: 1,
    });

    await client.connect();

    try {
      // Resolve peer
      const peer = parseInt(chatId, 10);
      const dialogs = await client.getDialogs({ limit: 100 });

      let resolvedPeer: unknown = "me";
      let found = false;

      for (const dialog of dialogs) {
        const entity = dialog.entity;
        if (!entity) continue;
        const entityId = String((entity as unknown as { id?: { toString(): string } }).id ?? "");
        if (entityId && chatId === entityId) {
          resolvedPeer = dialog.inputEntity;
          found = true;
          break;
        }
      }

      if (!found) {
        resolvedPeer = await client.getEntity(isNaN(peer) ? chatId : peer);
      }

      // Get messages
      const messagesResult = await client.getMessages(resolvedPeer as Parameters<typeof client.getMessages>[0], {
        limit,
      });

      const me = await client.getMe();
      const myId = String((me as unknown as { id?: { toString(): string } }).id ?? "");

      // Get dialog to determine read status of outgoing messages
      let readOutboxMaxId = 0;
      for (const dialog of dialogs) {
        const entity = dialog.entity;
        if (!entity) continue;
        const entityId = String((entity as unknown as { id?: { toString(): string } }).id ?? "");
        if (entityId && chatId === entityId) {
          readOutboxMaxId = (dialog as unknown as { readOutboxMaxId?: number }).readOutboxMaxId ?? 0;
          break;
        }
      }

      const rawMsgs = (Array.isArray(messagesResult) ? messagesResult : [])
        .filter((msg: unknown) => !!msg)
        .reverse();

      const messages: ChatMessage[] = rawMsgs
        .map((msg: unknown) => {
          const m = msg as {
            id?: number;
            message?: string;
            date?: number;
            senderId?: { toString(): string };
            fromId?: { toString(): string };
            sender?: { id?: { toString(): string } };
            out?: boolean;
            media?: {
              className?: string;
              photo?: unknown;
              document?: { mimeType?: string; className?: string };
            };
          };
          // Use m.out as primary indicator — for outgoing messages, senderId/fromId
          // may be null/undefined in GramJS, causing the senderId comparison to fail.
          const senderId = m.senderId?.toString?.() || m.fromId?.toString?.() || m.sender?.id?.toString?.() || "";
          const isMine = m.out === true || senderId === myId;
          const isRead = isMine ? ((m.id ?? 0) <= readOutboxMaxId) : true;

          // Detect media type
          let hasMedia = false;
          let mediaType: string | null = null;
          if (m.media) {
            const mediaClass = m.media.className || "";
            hasMedia = true;
            if (mediaClass === "MessageMediaPhoto" || m.media.photo) {
              mediaType = "photo";
            } else if (mediaClass === "MessageMediaDocument" || m.media.document) {
              const doc = m.media.document;
              if (doc) {
                const mime = doc.mimeType || "";
                if (mime.startsWith("video/")) {
                  mediaType = "video";
                } else if (mime.startsWith("audio/")) {
                  mediaType = "audio";
                } else if (mime === "image/gif") {
                  mediaType = "gif";
                } else if (mime.startsWith("image/")) {
                  mediaType = "photo";
                } else {
                  mediaType = "document";
                }
              } else {
                mediaType = "document";
              }
            } else if (mediaClass === "MessageMediaWebPage") {
              mediaType = "link";
            } else {
              mediaType = "media";
            }
          }

          return {
            id: String(m.id || ""),
            from: senderId,
            content: m.message || "",
            timestamp: m.date ? new Date(m.date * 1000).toISOString() : new Date().toISOString(),
            isMine,
            isRead,
            hasMedia,
            mediaType,
            mediaData: null,
          };
        });

      // Download media for photo/gif messages in parallel (single connection)
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const enrichedMessages: ChatMessage[] = await Promise.all(
        messages.map(async (msg, i) => {
          let mediaData: string | null = null;
          if (msg.hasMedia && (msg.mediaType === "photo" || msg.mediaType === "gif")) {
            try {
              const buffer = await client.downloadMedia(rawMsgs[i] as any, {});
              if (buffer) {
                const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer));
                const ct = msg.mediaType === "gif" ? "image/gif" : "image/jpeg";
                mediaData = `data:${ct};base64,${buf.toString("base64")}`;
              }
            } catch {
              // silently fail — frontend will show placeholder
            }
          }
          return { ...msg, mediaData };
        }),
      );
      /* eslint-enable @typescript-eslint/no-explicit-any */

      return NextResponse.json({ messages: enrichedMessages });
    } finally {
      await client.disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("[Inbox Telegram Messages] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
