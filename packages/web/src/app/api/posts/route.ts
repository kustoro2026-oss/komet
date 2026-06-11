// API Route: Posts
// POST /api/posts — Create a new post (saves to DB)
// GET  /api/posts — List posts with pagination
// PUT  /api/posts — Update a post
// DELETE /api/posts — Soft-delete a post
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Normalize PostItem shape (matching what PostItem type expects)
function normalizePost(post: Record<string, unknown>) {
  const platforms = (post.platforms as Array<{ platform: string }>) || [];
  const rawTags = post.tags;
  const tags = Array.isArray(rawTags) ? (rawTags as string[]).filter(Boolean) : [];
  return {
    id: post.id as string,
    content: (post.content as string) || "",
    title: (post.title as string) || undefined,
    platforms: platforms.map((p: { platform: string }) => p.platform),
    status: post.status as string,
    scheduledFor: post.scheduledFor
      ? new Date(post.scheduledFor as string).toISOString()
      : undefined,
    createdAt: post.createdAt
      ? new Date(post.createdAt as string).toISOString()
      : new Date().toISOString(),
    engagement: (post.engagement as number) || 0,
    tags,
    mediaItems: (post.mediaItems as Array<{ type: string; url: string }>) || [],
  };
}


export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    const where: Record<string, unknown> = {
      userId: user.id,
      isDeleted: false,
    };
    if (status && status !== "all") where.status = status;
    if (search) where.content = { contains: search, mode: "insensitive" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
        include: { platforms: true },
        take: limit,
        skip: (page - 1) * limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.post.count({ where: where as any }),
    ]);

    return NextResponse.json({
      posts: posts.map(normalizePost),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Posts] GET error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to fetch posts" },
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
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, userId: user.id, isDeleted: false },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Posts] DELETE error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const body = await request.json();
    const {
      content,
      title,
      profileId,
      platforms,
      scheduledFor,
      timezone,
      publishNow,
      mediaItems,
      hashtags,
      tags,
      platformOverrides,
    } = body;

    // Validation
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile is required" },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: "Platforms must be an array" },
        { status: 400 }
      );
    }

    // Determine post status
    const status = publishNow ? "published" : (scheduledFor && !isNaN(new Date(scheduledFor).getTime())) ? "scheduled" : "draft";

    // Platforms required only when publishing
    if (status !== "draft" && platforms.length === 0) {
      return NextResponse.json(
        { error: "At least one platform is required to publish or schedule" },
        { status: 400 }
      );
    }

    // Create post (only attach platforms that have a valid accountId)
    const validPlatforms = platforms.filter((p: { accountId?: string }) => p.accountId);
    const platformData = validPlatforms.length > 0 ? {
      platforms: {
        create: validPlatforms.map((p: { platform: string; accountId: string }) => ({
          accountId: p.accountId,
          platform: p.platform,
          status: "pending",
          customContent: platformOverrides?.[p.platform] || null,
        })),
      },
    } : {};

    const post = await prisma.post.create({
      data: {
        profileId,
        userId: user.id,
        title: title || null,
        content,
        status,
        scheduledFor: (scheduledFor && !isNaN(new Date(scheduledFor).getTime())) ? new Date(scheduledFor) : null,
        timezone: timezone || "UTC",
        publishNow: publishNow ?? false,
        isDraft: status === "draft",
        hashtags: hashtags || [],
        tags: tags || [],
        mediaItems: mediaItems || [],
        ...platformData,
      },
      include: {
        platforms: true,
      },
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        platformCount: post.platforms.length,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Posts] POST error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const body = await request.json();
    const { id, content, title, status, scheduledFor, timezone, hashtags, tags, publishNow } = body;

    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.post.findFirst({
      where: { id, userId: user.id, isDeleted: false },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (content !== undefined) updateData.content = content;
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (scheduledFor !== undefined) updateData.scheduledFor = (scheduledFor && !isNaN(new Date(scheduledFor).getTime())) ? new Date(scheduledFor) : null;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (tags !== undefined) updateData.tags = tags;
    if (publishNow !== undefined) updateData.publishNow = publishNow;

    await prisma.post.updateMany({
      where: { id, userId: user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, id, status: updateData.status || existing.status });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Posts] PUT error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to update post" },
      { status: 500 }
    );
  }
}
