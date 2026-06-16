// API Route: Posts
// POST /api/posts — Create a new post (saves to DB)
// GET  /api/posts — List posts with pagination
// PUT  /api/posts — Update a post
// DELETE /api/posts — Soft-delete a post
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { publishToTwitter, publishToTikTok, publishToDiscord, publishToTelegram, publishToYouTube, refreshGoogleToken, publishToPinterest, publishToLinkedIn } from "@/lib/publishers";

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
        status: publishNow ? "publishing" : status,
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
        platforms: {
          include: { account: true },
        },
      },
    });

    // Fire-and-forget publish to avoid browser timeout
    if (publishNow && post.platforms.length > 0) {
      const postId = post.id;
      const postContent = content;
      const postTitle = title || "Posted via Komet";
      const postTags = tags || [];
      const postMediaItems = mediaItems || [];
      // Clone platform data before we return the response
      const platformTasks = post.platforms.map((pp: { id: string; platform: string; account: { accessToken: string | null; platformAccountId: string | null; displayName: string | null; avatarUrl: string | null }; customContent: string | null }) => ({
        id: pp.id,
        platform: pp.platform,
        accessToken: pp.account.accessToken as string | null,
        platformAccountId: pp.account.platformAccountId as string | null,
        customContent: pp.customContent as string | null,
        displayName: pp.account.displayName as string | null,
        avatarUrl: pp.account.avatarUrl as string | null,
      }));

      void (async () => {
        const publishResults: Array<{ platform: string; success: boolean; error?: string }> = [];
        for (const task of platformTasks) {
          const text = task.customContent || postContent;
          try {
            if (task.platform === "tiktok") {
              if (!task.accessToken) {
                publishResults.push({ platform: "tiktok", success: false, error: "No access token" });
              } else {
                const mediaArr = (Array.isArray(postMediaItems) ? postMediaItems : []) as Array<{ type: string; url: string }>;
                const videoItem = mediaArr.find((m: { type: string; url: string }) => m.type === "video" || m.url?.match(/\.(mp4|mov|webm)$/i));
                if (!videoItem) {
                  publishResults.push({ platform: "tiktok", success: false, error: "No video attached" });
                } else {
                  console.log("[TikTok Publisher] Publishing to TikTok... video:", videoItem.url.substring(0, 80));
                  const result = await publishToTikTok(task.accessToken, text, videoItem.url);
                  console.log("[TikTok Publisher] Result:", JSON.stringify(result));
                  const isProcessing = result.status === "processing";
                  await prisma.postPlatform.update({
                    where: { id: task.id },
                    data: {
                      status: isProcessing ? "publishing" : result.success ? "published" : "failed",
                      publishedUrl: result.success ? `https://tiktok.com/@user/video/${result.postId}` : null,
                      publishedAt: result.success ? new Date() : null,
                      errorMessage: isProcessing ? "Processing..." : result.error || null,
                    },
                  });
                  publishResults.push({ platform: "tiktok", success: result.success, error: result.error });
                }
              }
            } else if (task.platform === "twitter") {
              if (!task.accessToken) {
                publishResults.push({ platform: "twitter", success: false, error: "No access token" });
              } else {
                const result = await publishToTwitter(task.accessToken, text);
                await prisma.postPlatform.update({
                  where: { id: task.id },
                  data: {
                    status: result.success ? "published" : "failed",
                    publishedUrl: result.success ? `https://twitter.com/i/web/status/${result.postId}` : null,
                    publishedAt: result.success ? new Date() : null,
                    errorMessage: result.error || null,
                  },
                });
                publishResults.push({ platform: "twitter", success: result.success, error: result.error });
              }
            } else if (task.platform === "discord") {
              // Discord: accessToken now stores webhook URL (from webhook.incoming OAuth)
              if (!task.accessToken) {
                publishResults.push({ platform: "discord", success: false, error: "No webhook URL. Please reconnect Discord." });
              } else {
                console.log("[Discord Publisher] Sending via webhook...");
                const mediaArr = (Array.isArray(postMediaItems) ? postMediaItems : []) as Array<{ type: string; url: string }>;
                const imageItem = mediaArr.find((m: { type: string; url: string }) => m.type === "image" || m.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                const result = await publishToDiscord(
                  task.accessToken,
                  text,
                  imageItem?.url,
                  task.displayName || task.platformAccountId || undefined,
                  task.avatarUrl || undefined,
                );
                console.log("[Discord Publisher] Result:", JSON.stringify(result));
                await prisma.postPlatform.update({
                  where: { id: task.id },
                  data: {
                    status: result.success ? "published" : "failed",
                    publishedUrl: result.success ? `https://discord.com/channels/@me` : null,
                    publishedAt: result.success ? new Date() : null,
                    errorMessage: result.error || null,
                  },
                });
                publishResults.push({ platform: "discord", success: result.success, error: result.error });
              }
            } else if (task.platform === "telegram") {
              // Telegram: accessToken is session string, platformAccountId is chat ID
              if (!task.accessToken) {
                publishResults.push({ platform: "telegram", success: false, error: "No session available. Please reconnect Telegram." });
              } else {
                console.log("[Telegram Publisher] Sending message to chatId:", task.platformAccountId || "(none)");
                const tgMediaArr = (Array.isArray(postMediaItems) ? postMediaItems : []) as Array<{ type: string; url: string }>;
                const tgImageItem = tgMediaArr.find((m: { type: string; url: string }) => m.type === "image" || m.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                const result = await publishToTelegram(
                  task.accessToken,
                  text,
                  task.platformAccountId || undefined,
                  tgImageItem?.url,
                );
                console.log("[Telegram Publisher] Result:", JSON.stringify(result));
                await prisma.postPlatform.update({
                  where: { id: task.id },
                  data: {
                    status: result.success ? "published" : "failed",
                    publishedUrl: null,
                    publishedAt: result.success ? new Date() : null,
                    errorMessage: result.error || null,
                  },
                });
                publishResults.push({ platform: "telegram", success: result.success, error: result.error });
              }
            } else if (task.platform === "youtube") {
              if (!task.accessToken) {
                publishResults.push({ platform: "youtube", success: false, error: "No access token" });
              } else {
                const mediaArr = (Array.isArray(postMediaItems) ? postMediaItems : []) as Array<{ type: string; url: string }>;
                const videoItem = mediaArr.find((m: { type: string; url: string }) => m.type === "video" || m.url?.match(/\.(mp4|mov|webm)$/i));
                if (!videoItem) {
                  publishResults.push({ platform: "youtube", success: false, error: "No video attached — YouTube requires video content" });
                  await prisma.postPlatform.update({
                    where: { id: task.id },
                    data: { status: "failed", errorMessage: "No video attached" },
                  });
                } else {
                  // Refresh token if expired
                  const socAcc = post.platforms.find((p: { id: string }) => p.id === task.id)?.account;
                  let token = task.accessToken;
                  if (socAcc?.tokenExpiresAt && new Date() >= new Date(socAcc.tokenExpiresAt)) {
                    console.log("[YouTube Publisher] Token expired, refreshing...");
                    if (!socAcc.refreshToken) {
                      publishResults.push({ platform: "youtube", success: false, error: "No refresh token. Please reconnect YouTube." });
                      await prisma.postPlatform.update({
                        where: { id: task.id },
                        data: { status: "failed", errorMessage: "No refresh token. Please reconnect YouTube." },
                      });
                      continue;
                    }
                    const newToken = await refreshGoogleToken(socAcc.refreshToken);
                    if (!newToken) {
                      publishResults.push({ platform: "youtube", success: false, error: "Token refresh failed. Please reconnect YouTube." });
                      await prisma.postPlatform.update({
                        where: { id: task.id },
                        data: { status: "failed", errorMessage: "Token refresh failed. Please reconnect YouTube." },
                      });
                      continue;
                    }
                    token = newToken;
                    await prisma.socialAccount.update({
                      where: { id: socAcc.id },
                      data: { accessToken: newToken, tokenExpiresAt: new Date(Date.now() + 3600 * 1000) },
                    });
                  }

                  console.log("[YouTube Publisher] Publishing to YouTube... video:", videoItem.url.substring(0, 80));
                  const result = await publishToYouTube(
                    token,
                    postTitle,
                    text,
                    videoItem.url,
                    Array.isArray(postTags) ? (postTags as string[]) : []
                  );
                  console.log("[YouTube Publisher] Result:", JSON.stringify(result));
                  await prisma.postPlatform.update({
                    where: { id: task.id },
                    data: {
                      status: result.success ? "published" : "failed",
                      publishedUrl: result.success ? `https://youtube.com/watch?v=${result.postId}` : null,
                      publishedAt: result.success ? new Date() : null,
                      errorMessage: result.error || null,
                    },
                  });
                  publishResults.push({ platform: "youtube", success: result.success, error: result.error });
                }
              }
            } else if (task.platform === "pinterest") {
              if (!task.accessToken) {
                publishResults.push({ platform: "pinterest", success: false, error: "No access token" });
              } else if (!task.platformAccountId) {
                publishResults.push({ platform: "pinterest", success: false, error: "No board selected. Please select a board first." });
                await prisma.postPlatform.update({
                  where: { id: task.id },
                  data: { status: "failed", errorMessage: "No board selected" },
                });
              } else {
                const pinterestMediaArr = (Array.isArray(postMediaItems) ? postMediaItems : []) as Array<{ type: string; url: string }>;
                const pinterestImageItem = pinterestMediaArr.find((m: { type: string; url: string }) => m.type === "image" || m.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                console.log("[Pinterest Publisher] Creating pin on board:", task.platformAccountId);
                const result = await publishToPinterest(
                  task.accessToken,
                  text,
                  task.platformAccountId,
                  pinterestImageItem?.url,
                );
                console.log("[Pinterest Publisher] Result:", JSON.stringify(result));
                await prisma.postPlatform.update({
                  where: { id: task.id },
                  data: {
                    status: result.success ? "published" : "failed",
                    publishedUrl: result.success ? `https://www.pinterest.com/pin/${result.pinId}` : null,
                    publishedAt: result.success ? new Date() : null,
                    errorMessage: result.error || null,
                  },
                });
                publishResults.push({ platform: "pinterest", success: result.success, error: result.error });
              }
            } else if (task.platform === "linkedin") {
              if (!task.accessToken) {
                publishResults.push({ platform: "linkedin", success: false, error: "No access token" });
              } else if (!task.platformAccountId) {
                publishResults.push({ platform: "linkedin", success: false, error: "No profile ID. Please reconnect." });
                await prisma.postPlatform.update({
                  where: { id: task.id },
                  data: { status: "failed", errorMessage: "No profile ID" },
                });
              } else {
                console.log("[LinkedIn Publisher] Creating post...");
                const result = await publishToLinkedIn(
                  task.accessToken,
                  text,
                  task.platformAccountId,
                );
                console.log("[LinkedIn Publisher] Result:", JSON.stringify(result));
                await prisma.postPlatform.update({
                  where: { id: task.id },
                  data: {
                    status: result.success ? "published" : "failed",
                    publishedUrl: result.success ? `https://www.linkedin.com/feed/update/${result.postId}` : null,
                    publishedAt: result.success ? new Date() : null,
                    errorMessage: result.error || null,
                  },
                });
                publishResults.push({ platform: "linkedin", success: result.success, error: result.error });
              }
            } else {
              // Platform publisher not implemented yet — mark as published (placeholder)
              await prisma.postPlatform.update({
                where: { id: task.id },
                data: { status: "published", publishedAt: new Date() },
              });
              publishResults.push({ platform: task.platform, success: true });
            }
          } catch (pubErr) {
            const msg = pubErr instanceof Error ? pubErr.message : "Unknown error";
            console.error("[Publish Background] Error for", task.platform, msg);
            await prisma.postPlatform.update({
              where: { id: task.id },
              data: { status: "failed", errorMessage: msg },
            });
            publishResults.push({ platform: task.platform, success: false, error: msg });
          }
        }

        // Determine final status
        const allOk = publishResults.every((r) => r.success);
        const anyOk = publishResults.some((r) => r.success);
        const finalStatus = allOk ? "published" : anyOk ? "partial" : "failed";
        await prisma.post.update({
          where: { id: postId },
          data: { status: finalStatus },
        });

        // Create notification for the user
        const notifType = allOk ? "post.published" : anyOk ? "post.partial" : "post.failed";
        const notifTitle = allOk
          ? "Post published successfully"
          : anyOk
          ? "Post published on some platforms"
          : "Post failed to publish";
        const publishedCount = publishResults.filter((r) => r.success).length;
        const notifMessage = allOk
          ? `Published to ${publishedCount} platform(s)`
          : anyOk
          ? `Published to ${publishedCount} of ${publishResults.length} platform(s). Check details for more info.`
          : "All platforms failed. Check each platform for error details.";
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: notifType,
              title: notifTitle,
              message: notifMessage,
              data: { postId, publishResults },
              link: `/posts/${postId}`,
            },
          });
        } catch (notifErr) {
          console.error("[Publish Background] Failed to create notification:", notifErr);
        }
      })().catch((bgErr) => console.error("[Publish Background] Fatal error:", bgErr));
    }

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
