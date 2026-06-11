import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Find Komet user by supabaseId

    // Get social accounts for this user
    const socialAccounts = await prisma.socialAccount.findMany({
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Get posts for this user
    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        title: true,
        status: true,
        scheduledFor: true,
        createdAt: true,
        tags: true,
        hashtags: true,
        platforms: {
          select: { platform: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    // Map to match the shape expected by analytics pages
    const mappedAccounts = (socialAccounts as Array<{
      id: string;
      platform: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      isActive: boolean;
    }>).map((a) => ({
      id: a.id,
      platform: a.platform,
      username: a.username,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
      isActive: a.isActive,
    }));

    const mappedPosts = (posts as Array<{
      id: string;
      content: string;
      title: string | null;
      status: string;
      scheduledFor: Date | null;
      createdAt: Date;
      tags: unknown;
      platforms: Array<{ platform: string }>;
    }>).map((p) => ({
      id: p.id,
      content: p.content,
      title: p.title || undefined,
      platforms: p.platforms.map((pl) => pl.platform),
      status: p.status,
      scheduledFor: p.scheduledFor?.toISOString(),
      createdAt: p.createdAt.toISOString(),
      engagement: 0, // Platform engagement data not available from DB
      tags: (p.tags as string[]) || [],
    }));

    return NextResponse.json({
      accounts: mappedAccounts,
      posts: mappedPosts,
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

