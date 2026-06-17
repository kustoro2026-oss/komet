// API Route: Unified Inbox Conversations
// GET /api/inbox/conversations — Aggregated conversations from all connected platforms
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
  kind: "message" | "comment";
  type?: string;
  accountId?: string;
  accountUsername?: string;
}

// --- Telegram Integration ---
async function fetchTelegramConversations(userId: string): Promise<Conversation[]> {
  if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) return [];

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const account = await prisma.socialAccount.findFirst({
    where: {
      platform: "telegram",
      isActive: true,
      profile: { workspace: { ownerId: userId } },
    } as any,
    select: { id: true, accessToken: true, username: true },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (!account?.accessToken) return [];

  const stringSession = new StringSession(account.accessToken);
  const client = new TelegramClient(stringSession, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
    connectionRetries: 1,
  });

  try {
    await client.connect();
    const dialogs = await client.getDialogs({ limit: 50 });
    const conversations: Conversation[] = [];

    for (const dialog of dialogs) {
      const entity = dialog.entity;
      if (!entity) continue;

      let id: string;
      let name: string;
      let type: string;

      if (entity.className === "User") {
        const u = entity as { id: { toString(): string }; firstName?: string; lastName?: string; username?: string };
        id = u.id.toString();
        name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Private Chat";
        type = "private";
      } else if (entity.className === "Chat") {
        const c = entity as { id: { toString(): string }; title?: string };
        id = c.id.toString();
        name = c.title || "Group";
        type = "group";
      } else if (entity.className === "Channel") {
        const ch = entity as { id: { toString(): string }; title?: string };
        id = ch.id.toString();
        name = ch.title || "Channel";
        type = "channel";
      } else {
        continue;
      }

      const message = dialog.message;
      let lastMessage = "";
      if (message) {
        lastMessage = typeof (message as { message?: string }).message === "string"
          ? (message as { message: string }).message
          : "";
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
        kind: "message",
        type,
        accountId: account.id,
        accountUsername: account.username || "",
      });
    }

    return conversations;
  } catch (err) {
    console.error("[Inbox] Telegram fetch error:", err);
    return [];
  } finally {
    await client.disconnect().catch(() => {});
  }
}

// --- Twitter/X Integration (API v2, 2025-2026) ---
// Official docs: https://docs.x.com/x-api/direct-messages/manage/introduction
// Domain: api.x.com (also works with api.twitter.com)
async function fetchTwitterConversations(userId: string): Promise<Conversation[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform: "twitter",
      isActive: true,
      profile: { workspace: { ownerId: userId } },
    } as any,
    select: { id: true, username: true, accessToken: true, platformAccountId: true },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (accounts.length === 0) return [];

  const conversations: Conversation[] = [];
  for (const account of accounts) {
    if (account.accessToken) {
      try {
        // X API v2: Look up DM conversations for the authenticated user
        // Note: v2 DM lookup requires specific scopes (dm.read, dm.write)
        const res = await fetch(
          `https://api.x.com/2/dm_conversations/with/${account.platformAccountId || account.username}?dm_event.fields=id,text,created_at,sender_id`,
          { headers: { Authorization: `Bearer ${account.accessToken}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            const items = Array.isArray(data.data) ? data.data : [data.data];
            for (const dm of items) {
              conversations.push({
                id: dm.id || `tw-dm-${account.id}`,
                name: `@${account.username || "Twitter"}`,
                platform: "twitter",
                lastMessage: (dm.text || "").slice(0, 60),
                timestamp: dm.created_at || new Date().toISOString(),
                unread: false,
                kind: "message" as const,
                type: "dm",
                accountId: account.id,
                accountUsername: account.username || "",
              });
            }
          }
        }
      } catch {
        // API call failed, fall through to placeholder
      }
    }

    // If no real DMs fetched, show connected status
    if (!conversations.some((c) => c.platform === "twitter" && c.accountId === account.id)) {
      conversations.push({
        id: `twitter-${account.id}`,
        name: `@${account.username || "Twitter Account"}`,
        platform: "twitter",
        lastMessage: "X DMs connected — requires dm.read scope for live messages",
        timestamp: new Date().toISOString(),
        unread: false,
        kind: "message",
        type: "dm",
        accountId: account.id,
        accountUsername: account.username || "",
      });
    }
  }

  return conversations;
}

// --- LinkedIn Integration (2025-2026) ---
// Official LinkedIn API does NOT provide messaging for general developers.
// Messaging requires enterprise Marketing Developer Platform approval or
// third-party providers like ConnectSafely API.
// Ref: https://connectsafely.ai/articles/linkedin-api-complete-guide-2026
async function fetchLinkedInConversations(userId: string): Promise<Conversation[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform: "linkedin",
      isActive: true,
      profile: { workspace: { ownerId: userId } },
    } as any,
    select: { id: true, username: true, displayName: true },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return accounts.map((account) => ({
    id: `linkedin-${account.id}`,
    name: account.displayName || account.username || "LinkedIn Account",
    platform: "linkedin",
    lastMessage: "LinkedIn connected — messaging requires enterprise API access",
    timestamp: new Date().toISOString(),
    unread: false,
    kind: "message" as const,
    type: "inmail",
    accountId: account.id,
    accountUsername: account.username || "",
  }));
}

// --- Discord Integration ---
async function fetchDiscordConversations(userId: string): Promise<Conversation[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform: "discord",
      isActive: true,
      profile: { workspace: { ownerId: userId } },
    } as any,
    select: { id: true, username: true, displayName: true },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return accounts.map((account) => ({
    id: `discord-${account.id}`,
    name: account.displayName || account.username || "Discord Account",
    platform: "discord",
    lastMessage: "Discord messages connected — messages will appear here",
    timestamp: new Date().toISOString(),
    unread: false,
    kind: "message" as const,
    type: "dm",
    accountId: account.id,
    accountUsername: account.username || "",
  }));
}

// --- YouTube Integration ---
async function fetchYouTubeConversations(userId: string): Promise<Conversation[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform: "youtube",
      isActive: true,
      profile: { workspace: { ownerId: userId } },
    } as any,
    select: { id: true, username: true, displayName: true },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return accounts.map((account) => ({
    id: `youtube-${account.id}`,
    name: account.displayName || account.username || "YouTube Channel",
    platform: "youtube",
    lastMessage: "YouTube comments connected — activity will appear here",
    timestamp: new Date().toISOString(),
    unread: false,
    kind: "comment" as const,
    type: "comment",
    accountId: account.id,
    accountUsername: account.username || "",
  }));
}

// --- TikTok Integration (2025-2026) ---
// TikTok does NOT provide a DM/messaging API.
// TikTok API for Business is advertising-only.
// Ref: https://stackoverflow.com/questions/77044183
async function fetchTikTokConversations(userId: string): Promise<Conversation[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform: "tiktok",
      isActive: true,
      profile: { workspace: { ownerId: userId } },
    } as any,
    select: { id: true, username: true, displayName: true },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return accounts.map((account) => ({
    id: `tiktok-${account.id}`,
    name: account.displayName || account.username || "TikTok Account",
    platform: "tiktok",
    lastMessage: "TikTok connected — DM API not available (comments only)",
    timestamp: new Date().toISOString(),
    unread: false,
    kind: "comment" as const,
    type: "dm",
    accountId: account.id,
    accountUsername: account.username || "",
  }));
}

// --- Pinterest Integration (2025-2026) ---
// Pinterest API v5: No messaging endpoint. Comments on pins only.
// Ref: https://developers.pinterest.com/docs/api/v5/
async function fetchPinterestConversations(userId: string): Promise<Conversation[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform: "pinterest",
      isActive: true,
      profile: { workspace: { ownerId: userId } },
    } as any,
    select: { id: true, username: true, displayName: true },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return accounts.map((account) => ({
    id: `pinterest-${account.id}`,
    name: account.displayName || account.username || "Pinterest Account",
    platform: "pinterest",
    lastMessage: "Pinterest comments connected — activity will appear here",
    timestamp: new Date().toISOString(),
    unread: false,
    kind: "comment" as const,
    type: "comment",
    accountId: account.id,
    accountUsername: account.username || "",
  }));
}

// --- Instagram / Facebook Integration ---
async function fetchMetaConversations(userId: string, platform: "instagram" | "facebook"): Promise<Conversation[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const accounts = await prisma.socialAccount.findMany({
    where: {
      platform,
      isActive: true,
      profile: { workspace: { ownerId: userId } },
    } as any,
    select: { id: true, username: true, displayName: true },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return accounts.map((account) => ({
    id: `${platform}-${account.id}`,
    name: account.displayName || account.username || `${platform === "instagram" ? "Instagram" : "Facebook"} Account`,
    platform,
    lastMessage: platform === "instagram"
      ? "Instagram comments & DMs connected — activity will appear here"
      : "Facebook comments & messages connected — activity will appear here",
    timestamp: new Date().toISOString(),
    unread: false,
    kind: "comment" as const,
    type: platform === "instagram" ? "dm" : "comment",
    accountId: account.id,
    accountUsername: account.username || "",
  }));
}

// --- Main GET Handler ---
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind"); // "message" | "comment" | undefined (all)

    // Fetch from all platforms in parallel
    const results = await Promise.allSettled([
      fetchTelegramConversations(user.id),
      fetchTwitterConversations(user.id),
      fetchLinkedInConversations(user.id),
      fetchDiscordConversations(user.id),
      fetchYouTubeConversations(user.id),
      fetchTikTokConversations(user.id),
      fetchPinterestConversations(user.id),
      fetchMetaConversations(user.id, "instagram"),
      fetchMetaConversations(user.id, "facebook"),
    ]);

    // Merge all results, ignoring failed fetches
    const allConversations: Conversation[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allConversations.push(...result.value);
      }
    }

    // Also fetch commented posts from DB
    const posts = await prisma.post.findMany({
      where: { userId: user.id, status: "published", isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { platforms: true },
    });

    const postConversations: Conversation[] = posts.map((p: Record<string, unknown>) => {
      const platforms = (p.platforms as Array<{ platform: string; accountId: string; publishedUrl: string | null }>) || [];
      return {
        id: `post-${p.id as string}`,
        name: (p.content as string)?.slice(0, 40)?.replace(/\n/g, " ") + ((p.content as string)?.length > 40 ? "…" : "") || "Untitled Post",
        platform: platforms[0]?.platform || "twitter",
        lastMessage: "",
        timestamp: p.createdAt ? new Date(p.createdAt as string).toISOString() : new Date().toISOString(),
        unread: false,
        kind: "comment" as const,
        type: "post",
        accountId: platforms[0]?.accountId || "",
        accountUsername: "",
      };
    });

    // Merge conversations with posts
    const merged = [...allConversations, ...postConversations];
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by kind if requested
    const filtered = kind
      ? merged.filter((c) => c.kind === kind)
      : merged;

    return NextResponse.json({ conversations: filtered });
  } catch (err) {
    console.error("[Inbox Conversations] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

