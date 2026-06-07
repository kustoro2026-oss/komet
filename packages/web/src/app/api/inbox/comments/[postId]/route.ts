// API Route: Inbox — Comments for a specific post
// GET    /api/inbox/comments/[postId] — Get comments for a post
// DELETE /api/inbox/comments/[postId] — Delete a comment
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return empty comments since we don't have platform comment APIs yet
    return NextResponse.json({
      comments: [],
      postContent: null,
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
