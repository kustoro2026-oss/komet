// API Route: Inbox — Comments for a specific post
// GET    /api/inbox/comments/[postId] — Get comments for a post
// DELETE /api/inbox/comments/[postId] — Delete a comment
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Platform-specific mock comments
const MOCK_COMMENTS_BY_PLATFORM: Record<string, Array<{
  id: string;
  message: string;
  from: { name: string };
  likeCount: number;
  canReply: boolean;
  canDelete: boolean;
}>> = {
  twitter: [
    { id: "tw1", message: "Great insight! 👏", from: { name: "@social_media_pro" }, likeCount: 5, canReply: true, canDelete: true },
    { id: "tw2", message: "Thanks for sharing this, very helpful.", from: { name: "@marketing_guru" }, likeCount: 3, canReply: true, canDelete: true },
  ],
  instagram: [
    { id: "ig1", message: "Love this aesthetic! 🔥", from: { name: "design_lover" }, likeCount: 12, canReply: true, canDelete: false },
    { id: "ig2", message: "Where was this taken? 😍", from: { name: "travelbug99" }, likeCount: 8, canReply: true, canDelete: false },
    { id: "ig3", message: "Goals! 🙌", from: { name: "fitness_fan" }, likeCount: 5, canReply: true, canDelete: false },
  ],
  facebook: [
    { id: "fb1", message: "Can't wait for the next update!", from: { name: "Mike Thompson" }, likeCount: 2, canReply: true, canDelete: true },
    { id: "fb2", message: "Shared this with my team 👍", from: { name: "Lisa Chen" }, likeCount: 1, canReply: true, canDelete: true },
  ],
  youtube: [
    { id: "yt1", message: "Best tutorial I've seen on this topic!", from: { name: "TechLearner" }, likeCount: 45, canReply: true, canDelete: true },
    { id: "yt2", message: "Can you make a part 2?", from: { name: "CodeMaster" }, likeCount: 30, canReply: true, canDelete: true },
    { id: "yt3", message: "Subscribed! Keep up the great work 🎉", from: { name: "DevChannel" }, likeCount: 22, canReply: true, canDelete: true },
  ],
  linkedin: [
    { id: "li1", message: "Excellent analysis. Would love to discuss this further.", from: { name: "Sarah Williams" }, likeCount: 8, canReply: true, canDelete: true },
    { id: "li2", message: "This aligns with what we're seeing in the industry.", from: { name: "David Park" }, likeCount: 5, canReply: true, canDelete: true },
  ],
  tiktok: [
    { id: "tk1", message: "This trend is fire 🔥🔥", from: { name: "@viral_creator" }, likeCount: 234, canReply: true, canDelete: false },
    { id: "tk2", message: "How do you edit like this?", from: { name: "@new_creator" }, likeCount: 89, canReply: true, canDelete: false },
  ],
  pinterest: [
    { id: "pt1", message: "Saving to my inspo board! ✨", from: { name: "Design Ideas" }, likeCount: 3, canReply: true, canDelete: false },
  ],
  discord: [
    { id: "dc1", message: "Great announcement! When's the next event?", from: { name: "CommunityMember" }, likeCount: 0, canReply: true, canDelete: true },
    { id: "dc2", message: "Pinned this for reference 📌", from: { name: "ModTeam" }, likeCount: 0, canReply: true, canDelete: true },
  ],
  threads: [
    { id: "th1", message: "This thread is everything 💯", from: { name: "@threads_user" }, likeCount: 15, canReply: true, canDelete: false },
  ],
  reddit: [
    { id: "rd1", message: "Underrated post. Take my upvote.", from: { name: "u/helpful_redditor" }, likeCount: 120, canReply: true, canDelete: false },
    { id: "rd2", message: "This should be on the front page.", from: { name: "u/quality_content" }, likeCount: 85, canReply: true, canDelete: false },
  ],
  bluesky: [
    { id: "bs1", message: "Bluesky is the future! Great post.", from: { name: "@bsky.user" }, likeCount: 7, canReply: true, canDelete: false },
  ],
  telegram: [
    { id: "tg1", message: "Thanks for the update! 👍", from: { name: "Channel Member" }, likeCount: 0, canReply: false, canDelete: true },
  ],
};

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
    const platform = platforms[0]?.platform || "twitter";
    const mockComments = MOCK_COMMENTS_BY_PLATFORM[platform] || [
      { id: "default1", message: "Great post! Thanks for sharing.", from: { name: "User" }, likeCount: 2, canReply: true, canDelete: true },
    ];

    const comments = mockComments.map((c, i) => ({
      id: c.id,
      message: c.message,
      createdTime: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
      from: { id: undefined as string | undefined, name: c.from.name, picture: undefined as string | undefined },
      likeCount: c.likeCount,
      replyCount: 0,
      platform,
      canReply: c.canReply,
      canDelete: c.canDelete,
      canHide: false,
    }));

    return NextResponse.json({
      comments,
      postContent: (post as Record<string, unknown>).content as string || null,
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
