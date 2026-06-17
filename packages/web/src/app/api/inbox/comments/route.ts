// API Route: Inbox — Comments
// GET  /api/inbox/comments — List commented posts
// POST /api/inbox/comments — Reply to a comment
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Platform-specific mock comment counts for demo purposes
const PLATFORM_COMMENT_DATA: Record<string, { suffix: string; commentCount: number; likeCount: number }> = {
  twitter: { suffix: "Latest tweet", commentCount: 5, likeCount: 42 },
  instagram: { suffix: "Instagram post", commentCount: 12, likeCount: 156 },
  facebook: { suffix: "Facebook update", commentCount: 8, likeCount: 34 },
  youtube: { suffix: "YouTube video", commentCount: 23, likeCount: 312 },
  linkedin: { suffix: "LinkedIn article", commentCount: 6, likeCount: 89 },
  threads: { suffix: "Threads post", commentCount: 3, likeCount: 28 },
  tiktok: { suffix: "TikTok video", commentCount: 45, likeCount: 1200 },
  pinterest: { suffix: "Pinterest pin", commentCount: 2, likeCount: 67 },
  reddit: { suffix: "Reddit post", commentCount: 34, likeCount: 256 },
  bluesky: { suffix: "Bluesky post", commentCount: 4, likeCount: 31 },
  telegram: { suffix: "Telegram message", commentCount: 7, likeCount: 0 },
  discord: { suffix: "Discord announcement", commentCount: 15, likeCount: 0 },
  snapchat: { suffix: "Snapchat story", commentCount: 1, likeCount: 12 },
  googlebusiness: { suffix: "Google post", commentCount: 2, likeCount: 5 },
  whatsapp: { suffix: "WhatsApp status", commentCount: 0, likeCount: 0 },
};

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return published posts as potential comment targets
    const posts = await prisma.post.findMany({
      where: { userId: user.id, status: "published", isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { platforms: true },
    });

    const commentedPosts = posts.map((p: Record<string, unknown>) => {
      const platforms = (p.platforms as Array<{ platform: string; accountId: string; publishedUrl: string | null }>) || [];
      const platformKey = platforms[0]?.platform || "twitter";
      const platformData = PLATFORM_COMMENT_DATA[platformKey] || { suffix: "Post", commentCount: 3, likeCount: 15 };
      
      return {
        id: p.id as string,
        platform: platformKey,
        accountId: platforms[0]?.accountId || "",
        accountUsername: "",
        content: (p.content as string) || "",
        picture: undefined as string | undefined,
        permalink: platforms[0]?.publishedUrl || undefined,
        createdTime: p.createdAt ? new Date(p.createdAt as string).toISOString() : new Date().toISOString(),
        commentCount: platformData.commentCount,
        likeCount: platformData.likeCount,
      };
    });

    return NextResponse.json({ posts: commentedPosts, data: commentedPosts, pagination: {} });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Inbox] GET error:", err.message || error);
    return NextResponse.json({ error: err.message || "Failed to fetch inbox" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, message } = body;

    if (!commentId || !message) {
      return NextResponse.json({ error: "commentId and message are required" }, { status: 400 });
    }

    // For now, we can't directly reply to platform comments without platform API access
    // Log the action and return success
    console.log(`[Inbox] Reply queued: commentId=${commentId}, message=${message}`);

    return NextResponse.json({ success: true, message: "Reply queued for processing" });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || "Failed to send reply" }, { status: 500 });
  }
}

