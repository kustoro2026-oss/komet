import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export const dynamic = "force-dynamic";

const TELEGRAM_API_ID = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || "";

interface ChatInfo {
  id: string;
  name: string;
  type: "private" | "group" | "supergroup" | "channel";
  username?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
      return NextResponse.json({ error: "Telegram API credentials not configured" }, { status: 500 });
    }

    // Get the account with its session
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, platform: "telegram", userId: user.id },
    });

    if (!account || !account.accessToken) {
      return NextResponse.json({ error: "Account not found or no session available" }, { status: 404 });
    }

    // Deserialize session and create client
    const stringSession = new StringSession(account.accessToken);
    const client = new TelegramClient(stringSession, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
      connectionRetries: 2,
    });

    try {
      await client.connect();

      // Get dialogs (chats)
      const dialogs = await client.getDialogs({ limit: 200 });

      const chats: ChatInfo[] = [];

      for (const dialog of dialogs) {
        const entity = dialog.entity;
        if (!entity) continue;

        let id: string;
        let name: string;
        let type: ChatInfo["type"];
        let username: string | undefined;

        // Extract info based on entity type
        if (entity.className === "User") {
          const user = entity as { id: { toString(): string }; firstName?: string; lastName?: string; username?: string };
          id = user.id.toString();
          const parts = [user.firstName, user.lastName].filter(Boolean);
          name = parts.join(" ") || user.username || "Private Chat";
          type = "private";
          username = user.username;
        } else if (entity.className === "Chat") {
          const chat = entity as { id: { toString(): string }; title?: string };
          id = chat.id.toString();
          name = chat.title || "Group";
          type = "group";
        } else if (entity.className === "Channel") {
          const channel = entity as { id: { toString(): string }; title?: string; username?: string; megagroup?: boolean };
          id = channel.id.toString();
          name = channel.title || "Channel";
          type = channel.megagroup ? "supergroup" : "channel";
          username = channel.username;
        } else {
          continue;
        }

        chats.push({ id, name, type, username });
      }

      // Add "Saved Messages" as first option
      await client.getMe();
      chats.unshift({
        id: "me",
        name: "Saved Messages",
        type: "private",
      });

      return NextResponse.json({ chats });
    } finally {
      await client.disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("[Telegram Chats] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch chats" },
      { status: 500 }
    );
  }
}
