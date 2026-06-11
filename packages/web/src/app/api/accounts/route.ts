import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const accounts = await prisma.socialAccount.findMany({
      where: {
        profile: {
          workspace: {
            ownerId: user.id,
          },
        },
      },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isActive: true,
        accessToken: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[Accounts API] Found", accounts.length, "accounts for user", user.id);
    console.log("[Accounts API] Accounts:", JSON.stringify(accounts.map((a) => ({ platform: a.platform, username: a.username, displayName: a.displayName }))));

    // Explicit type for mapped accounts
    type AccountRow = {
      id: string;
      platform: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      isActive: boolean;
      createdAt: Date;
      accessToken: string | null;
    };

    const mappedAccounts = await Promise.all(
      (accounts as AccountRow[]).map(async (a) => {
        let followers = 0;

        // Fetch real follower count from platform API if we have an access token
        if (a.accessToken) {
          try {
            if (a.platform === "tiktok") {
              const res = await fetch(
                "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url,follower_count",
                { headers: { Authorization: `Bearer ${a.accessToken}` } }
              );
              const data = await res.json();
              followers = data?.data?.user?.follower_count || 0;
            }
            // Add more platforms here as needed
          } catch {
            // Silently fall back to 0
          }
        }

        return {
          id: a.id,
          platform: a.platform,
          username: a.username,
          displayName: a.displayName,
          avatarUrl: a.avatarUrl,
          isActive: a.isActive,
          followers,
          connectedAt: a.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json(mappedAccounts);
  } catch (error) {
    console.error("Accounts list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("id");

    if (!accountId) {
      return NextResponse.json({ error: "Account ID required" }, { status: 400 });
    }



    // Verify ownership before deleting
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        profile: {
          workspace: {
            ownerId: user.id,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await prisma.socialAccount.delete({ where: { id: accountId } });

    return NextResponse.json({ success: true, message: "Account disconnected" });
  } catch (error) {
    console.error("Account delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
