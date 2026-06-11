// GET  /api/discord/channels?accountId=xxx — List Discord guilds & text channels
// POST /api/discord/channels — Save channel ID for an account
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

    // Get the Discord account with access token
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, platform: "discord" },
    });

    if (!account?.accessToken) {
      return NextResponse.json({ error: "Discord account not found or not connected" }, { status: 404 });
    }

    // Use raw token (strip ::channelId suffix if present)
    const rawToken = account.accessToken.split("::")[0];

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
            .filter((c) => c.type === 0) // type 0 = GUILD_TEXT
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

// POST — Save channel ID to account
// Body: { accountId: string, channelId: string }
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, channelId } = body as { accountId?: string; channelId?: string };

    if (!accountId || !channelId) {
      return NextResponse.json({ error: "accountId and channelId are required" }, { status: 400 });
    }

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, platform: "discord" },
    });

    if (!account?.accessToken) {
      return NextResponse.json({ error: "Discord account not found" }, { status: 404 });
    }

    // Store channel ID: remove any existing ::channelId suffix, then append
    const rawToken = account.accessToken.split("::")[0];
    const newToken = `${rawToken}::${channelId}`;

    await prisma.socialAccount.update({
      where: { id: accountId },
      data: { accessToken: newToken },
    });

    return NextResponse.json({ success: true, channelId });
  } catch (err) {
    console.error("[Discord Save Channel] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
