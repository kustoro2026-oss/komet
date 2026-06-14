// API Route: Telegram Media Proxy
// GET /api/inbox/telegram/media?chatId=xxx&messageId=xxx — Download and serve media
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export const dynamic = "force-dynamic";

const TELEGRAM_API_ID = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || "";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
      return NextResponse.json({ error: "Telegram API not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const messageId = searchParams.get("messageId");

    if (!chatId || !messageId) {
      return NextResponse.json({ error: "chatId and messageId are required" }, { status: 400 });
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
      return NextResponse.json({ error: "No active Telegram account" }, { status: 404 });
    }

    const stringSession = new StringSession(account.accessToken);
    const client = new TelegramClient(stringSession, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
      connectionRetries: 1,
    });

    await client.connect();

    try {
      // Resolve peer
      const peer = parseInt(chatId, 10);
      const dialogs = await client.getDialogs({ limit: 100 });

      let resolvedPeer: unknown;
      let found = false;

      for (const dialog of dialogs) {
        const entity = dialog.entity;
        if (!entity) continue;
        const entityId = String((entity as unknown as { id?: { toString(): string } }).id ?? "");
        if (entityId && chatId === entityId) {
          resolvedPeer = await client.getInputEntity(entity);
          found = true;
          break;
        }
      }

      if (!found) {
        resolvedPeer = await client.getEntity(isNaN(peer) ? chatId : peer);
      }

      // Get the specific message
      const messages = await client.getMessages(resolvedPeer as Parameters<typeof client.getMessages>[0], {
        ids: [parseInt(messageId, 10)],
      });

      if (!messages || messages.length === 0) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }

      const msg = messages[0] as unknown as { media?: unknown };
      if (!msg.media) {
        return NextResponse.json({ error: "No media in message" }, { status: 404 });
      }

      // Download media as buffer (use thumbnail size for photos when available)
      const buffer = await client.downloadMedia(msg as Parameters<typeof client.downloadMedia>[0], {
        // For photos, gramjs will use the smallest size automatically when we don't specify
      });

      if (!buffer || (Buffer.isBuffer(buffer) && buffer.length === 0)) {
        return NextResponse.json({ error: "Failed to download media" }, { status: 500 });
      }

      // gramjs downloadMedia returns a Buffer
      const buf: Buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer));

      // Determine content type
      let contentType = "application/octet-stream";
      const mediaClass = (msg.media as { className?: string }).className || "";

      if (mediaClass === "MessageMediaPhoto") {
        contentType = "image/jpeg";
      } else if (mediaClass === "MessageMediaDocument") {
        const doc = (msg.media as { document?: { mimeType?: string } }).document;
        if (doc?.mimeType) {
          contentType = doc.mimeType;
        }
      }

      // Use Uint8Array which satisfies NextResponse BodyInit type
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "Content-Length": String(buf.length),
        },
      });
    } finally {
      await client.disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("[Inbox Telegram Media] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch media" },
      { status: 500 },
    );
  }
}
