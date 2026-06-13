import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface TelegramChat {
  id: string;
  name: string;
  type: "private" | "group" | "supergroup" | "channel";
  username?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botToken = searchParams.get("botToken");

    if (!botToken) {
      return NextResponse.json({ error: "Bot token is required" }, { status: 400 });
    }

    // Validate bot token first
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!meRes.ok) {
      const err = await meRes.json().catch(() => ({})) as Record<string, unknown>;
      const desc = (err?.description || "Invalid bot token") as string;
      return NextResponse.json({ error: desc }, { status: 400 });
    }

    // Step 1: Get recent updates to discover chats the bot can see
    const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=100`);
    if (!updatesRes.ok) {
      return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
    }

    const updatesData = (await updatesRes.json()) as {
      ok: boolean;
      result?: Array<{
        message?: {
          chat: {
            id: number;
            type: string;
            title?: string;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        my_chat_member?: {
          chat: {
            id: number;
            type: string;
            title?: string;
            username?: string;
          };
        };
        channel_post?: {
          chat: {
            id: number;
            type: string;
            title?: string;
            username?: string;
          };
        };
      }>;
    };

    if (!updatesData.ok || !updatesData.result) {
      return NextResponse.json({ chats: [] });
    }

    // Step 2: Extract unique chats from updates
    const chatMap = new Map<string, TelegramChat>();

    for (const update of updatesData.result) {
      let chat: { id: number; type: string; title?: string; username?: string; first_name?: string; last_name?: string } | null = null;

      if (update.message?.chat) {
        chat = update.message.chat;
      } else if (update.my_chat_member?.chat) {
        chat = update.my_chat_member.chat;
      } else if (update.channel_post?.chat) {
        chat = update.channel_post.chat;
      }

      if (chat) {
        const chatId = String(chat.id);
        if (!chatMap.has(chatId)) {
          // Build a human-readable name
          let name: string;
          if (chat.type === "private") {
            const parts = [chat.first_name, chat.last_name].filter(Boolean);
            name = parts.join(" ") || chat.username || `Chat ${chatId}`;
          } else {
            name = chat.title || chat.username || `Chat ${chatId}`;
          }

          chatMap.set(chatId, {
            id: chatId,
            name,
            type: chat.type as TelegramChat["type"],
            username: chat.username,
          });
        }
      }
    }

    const chats = Array.from(chatMap.values());

    return NextResponse.json({ chats });
  } catch (err) {
    console.error("[Telegram Chats] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
