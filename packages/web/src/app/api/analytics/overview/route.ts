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

    // Find Komet user by supabaseId
    const kometUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    });

    if (!kometUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get social accounts for this user
    const socialAccounts = await prisma.socialAccount.findMany({
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Get posts for this user
    const posts = await prisma.post.findMany({
      where: {
        userId: kometUser.id,
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
    const mappedAccounts = socialAccounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      username: a.username,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
      isActive: a.isActive,
    }));

    const mappedPosts = posts.map((p) => ({
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

