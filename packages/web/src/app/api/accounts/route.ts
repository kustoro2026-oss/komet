import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@komet/db");

    const kometUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    });

    if (!kometUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: {
        profile: {
          workspace: {
            ownerId: kometUser.id,
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
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedAccounts = (accounts as Array<{
      id: string;
      platform: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      isActive: boolean;
      createdAt: Date;
    }>).map((a) => ({
      id: a.id,
      platform: a.platform,
      username: a.username,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
      isActive: a.isActive,
      followers: 0, // Follower data not available from local DB
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

    const { prisma } = await import("@komet/db");

    const kometUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    });

    if (!kometUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership before deleting
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        profile: {
          workspace: {
            ownerId: kometUser.id,
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
