// API Route: Fetch messages for a specific platform conversation
// GET /api/inbox/messages/[platform]/[conversationId] — Fetch messages
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

interface Message {
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

async function fetchTwitterDMs(accessToken: string, conversationId: string): Promise<Message[]> {
  try {
    // X API v2: Lookup DM events by conversation
    const res = await fetch(
      `https://api.x.com/2/dm_conversations/with/${conversationId}/dm_events?dm_event.fields=id,text,created_at,sender_id&max_results=30`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((dm: { id: string; text?: string; created_at?: string; sender_id?: string }) => ({
      id: dm.id,
      from: dm.sender_id || "user",
      content: dm.text || "",
      timestamp: dm.created_at || new Date().toISOString(),
      isMine: false,
      isRead: true,
      hasMedia: false,
      mediaType: null,
      mediaData: null,
    }));
  } catch {
    return [];
  }
}

async function fetchDiscordDMs(botToken: string, conversationId: string): Promise<Message[]> {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${conversationId}/messages?limit=30`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((msg: { id: string; author: { username: string }; content: string; timestamp: string; attachments: unknown[] }) => ({
      id: msg.id,
      from: msg.author?.username || "Unknown",
      content: msg.content || "",
      timestamp: msg.timestamp || new Date().toISOString(),
      isMine: false,
      isRead: true,
      hasMedia: (msg.attachments?.length || 0) > 0,
      mediaType: (msg.attachments?.length || 0) > 0 ? "photo" : null,
      mediaData: null,
    }));
  } catch {
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; conversationId: string }> }
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { platform, conversationId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    if (!conversationId) {
      return NextResponse.json({ messages: [] });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const account = await prisma.socialAccount.findFirst({
      where: {
        platform,
        isActive: true,
        ...(accountId ? { id: accountId } : {}),
        profile: { workspace: { ownerId: user.id } },
      } as any,
      select: { id: true, accessToken: true },
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Platform-specific fetches
    if (platform === "twitter" && account?.accessToken) {
      const dms = await fetchTwitterDMs(account.accessToken, conversationId);
      return NextResponse.json({ messages: dms.slice(0, limit) });
    }

    if (platform === "discord" && account?.accessToken) {
      const msgs = await fetchDiscordDMs(account.accessToken, conversationId);
      return NextResponse.json({ messages: msgs.slice(0, limit) });
    }

    // LinkedIn: Official API does NOT provide messaging for general developers.
    // Requires enterprise Marketing Developer Platform approval.
    // See: https://connectsafely.ai/articles/linkedin-api-complete-guide-2026
    if (platform === "linkedin") {
      const placeholderMessages: Message[] = [
        {
          id: `linkedin-info`,
          from: "Komet",
          content: "LinkedIn messaging requires enterprise API access. Your LinkedIn account is connected for content publishing and analytics.",
          timestamp: new Date().toISOString(),
          isMine: false,
          isRead: true,
          hasMedia: false,
          mediaType: null,
          mediaData: null,
        },
      ];
      return NextResponse.json({ messages: placeholderMessages });
    }

    // Placeholder messages for platforms without real-time API integration
    const platformLabels: Record<string, string> = {
      youtube: "YouTube comments",
      tiktok: "TikTok messages",
      pinterest: "Pinterest activity",
      instagram: "Instagram messages",
      facebook: "Facebook messages",
      threads: "Threads activity",
      reddit: "Reddit messages",
      bluesky: "Bluesky messages",
      snapchat: "Snapchat messages",
      googlebusiness: "Google Business messages",
      whatsapp: "WhatsApp messages",
    };

    const label = platformLabels[platform] || `${platform} messages`;
    const placeholderMessages: Message[] = [
      {
        id: `placeholder-info`,
        from: "Komet",
        content: `${label} connected. Platform API integration for live message retrieval will be available in a future update.`,
        timestamp: new Date().toISOString(),
        isMine: false,
        isRead: true,
        hasMedia: false,
        mediaType: null,
        mediaData: null,
      },
    ];

    return NextResponse.json({ messages: placeholderMessages });
  } catch (err) {
    console.error(`[Inbox Messages] GET error:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
