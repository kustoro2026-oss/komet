// API Route: Telegram Inbox — Mark as Read
// POST /api/inbox/telegram/[chatId]/read — Mark conversation as read
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram";

export const dynamic = "force-dynamic";

const TELEGRAM_API_ID = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || "";

export async function POST(
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
      return NextResponse.json({ error: "No active Telegram account" }, { status: 404 });
    }

    const stringSession = new StringSession(account.accessToken);
    const client = new TelegramClient(stringSession, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
      connectionRetries: 1,
    });

    await client.connect();

    try {
      // Resolve peer entity
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

      // Mark conversation as read using Telegram API
      await client.invoke(
        new Api.messages.ReadHistory({
          peer: resolvedPeer as Parameters<typeof client.invoke>[0] extends { peer: infer P } ? P : never,
          maxId: 0,
        }),
      );

      return NextResponse.json({ success: true });
    } finally {
      await client.disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("[Inbox Telegram Read] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mark as read" },
      { status: 500 },
    );
  }
}
