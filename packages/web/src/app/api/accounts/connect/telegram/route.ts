import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const botToken = body?.botToken as string | undefined;
    const chatId = body?.chatId as string | undefined;
    const profileId = body?.profileId as string | undefined;

    if (!botToken) {
      return NextResponse.json({ error: "Bot token is required" }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    // Step 1: Validate the bot token by calling Telegram getMe API
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!meRes.ok) {
      const err = await meRes.json().catch(() => ({})) as Record<string, unknown>;
      const desc = (err?.description || "Invalid bot token") as string;
      return NextResponse.json({ error: desc }, { status: 400 });
    }

    const meData = (await meRes.json()) as { result?: { id?: number; username?: string; first_name?: string } };
    const botInfo = meData.result;
    if (!botInfo || !botInfo.id) {
      return NextResponse.json({ error: "Could not verify bot" }, { status: 400 });
    }

    const botUsername = botInfo.username ? `@${botInfo.username}` : `Telegram Bot (${botInfo.first_name || botInfo.id})`;
    const botName = botInfo.first_name || botUsername;

    // Step 2: Save as a SocialAccount
    // - accessToken stores the bot token (for sending messages)
    // - platformAccountId stores the chat ID (destination for messages)
    const account = await prisma.socialAccount.create({
      data: {
        profileId,
        platform: "telegram",
        platformAccountId: chatId,
        username: botUsername,
        displayName: botName,
        accessToken: botToken,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: account.id,
      platform: "telegram",
      username: account.username,
      displayName: account.displayName,
    });
  } catch (err) {
    console.error("[Telegram Connect] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
