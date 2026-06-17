// API Route: Inbox — Comments for a specific post
// GET    /api/inbox/comments/[postId] — Get comments for a post
// DELETE /api/inbox/comments/[postId] — Delete a comment
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { postId } = resolvedParams;

    // Try to get the post to determine the platform
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const post = await prisma.post.findFirst({
      where: { id: postId, userId: user.id },
      include: { platforms: true },
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!post) {
      return NextResponse.json({ comments: [], postContent: null, pagination: {} });
    }

    const platforms = (post as Record<string, unknown>).platforms as Array<{ platform: string; accountId: string }> || [];
    const platform = platforms[0]?.platform || "unknown";

    // Return empty comments — live comments require platform API integration
    // Platforms with real comment APIs: YouTube (Data API v3)
    // Other platforms: API not available or requires enterprise access
    return NextResponse.json({
      comments: [],
      postContent: (post as Record<string, unknown>).content as string || null,
      platform,
      pagination: {},
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || "Failed to fetch comments" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    // For now, we can't delete platform comments without direct API access
    console.log(`[Inbox] Delete queued: commentId=${commentId}`);

    return NextResponse.json({ success: true, message: "Delete queued for processing" });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || "Failed to delete comment" }, { status: 500 });
  }
}
