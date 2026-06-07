// API Route: Unpublish Post
// POST /api/posts/[postId]/unpublish — Unpublish a post from a platform
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
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

    const body = await request.json();
    const { platform } = body;
    const { postId } = params;

    if (!postId || !platform) {
      return NextResponse.json({ error: "postId and platform are required" }, { status: 400 });
    }

    // Verify ownership
    const post = await prisma.post.findFirst({
      where: { id: postId, userId: kometUser.id, isDeleted: false },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Mark platform as failed (simulating unpublish)
    await prisma.postPlatform.updateMany({
      where: { postId, platform },
      data: { status: "failed" },
    });

    return NextResponse.json({ success: true, id: postId, status: post.status });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || "Failed to unpublish" }, { status: 500 });
  }
}

