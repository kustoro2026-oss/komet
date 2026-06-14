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
        followers: true,
        isActive: true,
        accessToken: true,
        platformAccountId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[Accounts API] Found", accounts.length, "accounts for user", user.id);
    accounts.forEach(a => console.log("[Accounts API] account:", a.platform, "| followers:", a.followers));

    const mappedAccounts = accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      username: a.username,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
      followers: a.followers,
      isActive: a.isActive,
      platformAccountId: a.platformAccountId,
      connectedAt: a.createdAt.toISOString(),
    }));

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
