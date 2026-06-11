// GET /api/discord/channels?accountId=xxx — List Discord guilds & text channels (for reference only)
// NOTE: With webhook.incoming OAuth flow, channel selection is handled by Discord during authorization.
// This endpoint is informational and requires storing the raw access token separately.
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
  guild_id?: string;
}

interface GuildWithChannels {
  id: string;
  name: string;
  icon: string | null;
  channels: { id: string; name: string }[];
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

    // With webhook.incoming flow, accessToken stores the webhook URL.
    // The guilds/channels API requires a bearer token.
    // Reconnect with identify+guilds scope to use this endpoint.
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, platform: "discord" },
    });

    if (!account?.accessToken) {
      return NextResponse.json({ error: "Discord account not found" }, { status: 404 });
    }

    // If accessToken looks like a webhook URL, try using refreshToken for API calls
    const rawToken = account.accessToken.startsWith("https://discord.com/api/webhooks/")
      ? account.refreshToken // fallback: use refreshToken for guild listing
      : account.accessToken;

    if (!rawToken || rawToken.startsWith("https://")) {
      return NextResponse.json({
        error: "Guild listing not available with webhook-only token. Reconnect Discord with identify+guilds scope to list channels.",
      }, { status: 400 });
    }

    // Fetch guilds
    const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${rawToken}` },
    });

    if (!guildsRes.ok) {
      return NextResponse.json({ error: `Failed to fetch guilds: ${guildsRes.status}` }, { status: 502 });
    }

    const guilds = (await guildsRes.json()) as DiscordGuild[];

    // Fetch channels for each guild and filter to text channels
    const guildsWithChannels: GuildWithChannels[] = [];
    for (const guild of guilds.slice(0, 10)) {
      try {
        const channelsRes = await fetch(
          `https://discord.com/api/v10/guilds/${guild.id}/channels`,
          { headers: { Authorization: `Bearer ${rawToken}` } },
        );

        if (channelsRes.ok) {
          const channels = (await channelsRes.json()) as DiscordChannel[];
          const textChannels = channels
            .filter((c) => c.type === 0)
            .map((c) => ({ id: c.id, name: c.name }));

          if (textChannels.length > 0) {
            guildsWithChannels.push({
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              channels: textChannels,
            });
          }
        }
      } catch {
        // Skip guilds we can't fetch channels for
      }
    }

    return NextResponse.json({ guilds: guildsWithChannels });
  } catch (err) {
    console.error("[Discord Channels] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
