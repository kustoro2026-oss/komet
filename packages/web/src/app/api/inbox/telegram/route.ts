// API Route: Telegram Inbox
// GET /api/inbox/telegram — List conversations (dialogs) with latest messages
// POST /api/inbox/telegram — Send a message to a chat
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export const dynamic = "force-dynamic";

const TELEGRAM_API_ID = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || "";

interface Conversation {
  id: string;
  name: string;
  platform: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  type: string;
  username?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
      return NextResponse.json({ error: "Telegram API not configured" }, { status: 500 });
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
      return NextResponse.json({ conversations: [] });
    }

    const stringSession = new StringSession(account.accessToken);
    const client = new TelegramClient(stringSession, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
      connectionRetries: 1,
    });

    await client.connect();

    try {
      const dialogs = await client.getDialogs({ limit: 50 });
      const conversations: Conversation[] = [];

      for (const dialog of dialogs) {
        const entity = dialog.entity;
        if (!entity) continue;

        let id: string;
        let name: string;
        let type: string;
        let username: string | undefined;

        if (entity.className === "User") {
          const userEntity = entity as { id: { toString(): string }; firstName?: string; lastName?: string; username?: string };
          id = userEntity.id.toString();
          const parts = [userEntity.firstName, userEntity.lastName].filter(Boolean);
          name = parts.join(" ") || userEntity.username || "Private Chat";
          type = "private";
          username = userEntity.username;
        } else if (entity.className === "Chat") {
          const chatEntity = entity as { id: { toString(): string }; title?: string };
          id = chatEntity.id.toString();
          name = chatEntity.title || "Group";
          type = "group";
        } else if (entity.className === "Channel") {
          const channelEntity = entity as { id: { toString(): string }; title?: string; username?: string };
          id = channelEntity.id.toString();
          name = channelEntity.title || "Channel";
          type = "channel";
          username = channelEntity.username;
        } else {
          continue;
        }

        // Get last message preview
        const message = dialog.message;
        let lastMessage = "";
        if (message) {
          lastMessage = typeof message.message === "string" ? message.message : "";
          if (!lastMessage && (message as { media?: unknown }).media) {
            lastMessage = "[Media]";
          }
        }

        conversations.push({
          id,
          name: name.length > 40 ? name.slice(0, 37) + "..." : name,
          platform: "telegram",
          lastMessage: lastMessage.length > 60 ? lastMessage.slice(0, 57) + "..." : lastMessage,
          timestamp: dialog.date ? new Date(dialog.date * 1000).toISOString() : new Date().toISOString(),
          unread: dialog.unreadCount > 0,
          type,
          username,
        });
      }

      return NextResponse.json({ conversations });
    } finally {
      await client.disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("[Inbox Telegram] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
      return NextResponse.json({ error: "Telegram API not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { chatId, message } = body;

    if (!chatId || !message) {
      return NextResponse.json({ error: "chatId and message are required" }, { status: 400 });
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
      // Resolve the peer entity
      const peer = parseInt(chatId, 10);
      const dialogs = await client.getDialogs({ limit: 100 });

      let resolvedPeer: Parameters<typeof client.sendMessage>[0] = "me";
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

      await client.sendMessage(resolvedPeer, { message });

      return NextResponse.json({ success: true });
    } finally {
      await client.disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("[Inbox Telegram] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send message" },
      { status: 500 },
    );
  }
}
