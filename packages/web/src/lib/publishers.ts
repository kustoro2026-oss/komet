// Inline publisher functions for social media platforms.
// Moved to @komet/web after removing the @komet/api package.

// ─── Twitter ───────────────────────────────────────────────────────

interface TwitterPublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

async function publishToTwitter(accessToken: string, text: string): Promise<TwitterPublishResult> {
  try {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      return { success: false, error: (err?.detail || `Twitter API error: ${res.status}`) as string };
    }

    const data = (await res.json()) as { data: { id: string } };
    return { success: true, postId: data.data.id };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── TikTok ────────────────────────────────────────────────────────

interface TikTokStatusResult {
  status: string;
  postId?: string;
}

async function checkTikTokStatus(
  accessToken: string,
  publishId: string,
  maxAttempts = 3,
): Promise<TikTokStatusResult> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publish_id: publishId }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as Record<string, unknown>;
        console.error(
          "[TikTok Publisher] Status check error:",
          res.status,
          JSON.stringify(errBody),
        );
        return { status: "FAILED" };
      }

      const data = (await res.json()) as { data?: { status?: string; publish_id?: string } };
      const status = data.data?.status || "";
      console.log(
        `[TikTok Publisher] Status check ${attempt + 1}/${maxAttempts}: ${status}`,
      );

      if (status === "PUBLISH_COMPLETE") {
        return { status: "PUBLISH_COMPLETE", postId: data.data?.publish_id };
      }

      if (status === "FAILED") {
        return { status: "FAILED" };
      }

      // Still processing — wait then retry
      await delay(3000);
    } catch (err: unknown) {
        console.error("[TikTok Publisher] Status check network error:", (err as Error)?.message);
      await delay(3000);
    }
  }

  return { status: "PROCESSING_UPLOAD", postId: publishId };
}

async function publishToTikTok(
  accessToken: string,
  caption: string,
  videoUrl: string,
): Promise<{ success: boolean; postId?: string; error?: string; status?: string }> {
  try {
    // Step 1: Init content publishing
    console.log("[TikTok Publisher] Init publish...");
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/info/create/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: caption || "Posted via Komet",
          video_url: videoUrl,
          privacy_level: "PUBLIC",
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        },
        post_mode: "PULL_FROM_URL",
      }),
    });

    if (!initRes.ok) {
      const errBody = await initRes.json().catch(() => ({}));
      console.error("[TikTok Publisher] Init error:", initRes.status, JSON.stringify(errBody));
      return {
        success: false,
        error: ((errBody as Record<string, unknown>)?.error as Record<string, string>)?.message || `TikTok init error: ${initRes.status}`,
      };
    }

    const initData = (await initRes.json()) as { data?: { publish_id?: string } };
    const publishId = initData.data?.publish_id;

    if (!publishId) {
      console.error("[TikTok Publisher] No publish_id in init response:", JSON.stringify(initData));
      return { success: false, error: "No publish_id returned" };
    }

    console.log("[TikTok Publisher] Init OK, publish_id:", publishId);

    // Step 2: Poll for status
    const statusResult = await checkTikTokStatus(accessToken, publishId);

    if (statusResult.status === "PUBLISH_COMPLETE") {
      return { success: true, postId: statusResult.postId || publishId, status: "PUBLISH_COMPLETE" };
    }

    if (statusResult.status === "FAILED") {
      return { success: false, error: "TikTok reported FAILED during status check" };
    }

    // Still processing — return success=true since init succeeded,
    // tell the UI it's still processing
    return {
      success: true,
      postId: publishId,
      status: "processing",
    };
  } catch (err: unknown) {
    console.error("[TikTok Publisher] Error:", (err as Error)?.message);
    return { success: false, error: (err as Error)?.message || "Unknown error" };
  }
}

export { publishToTwitter, publishToTikTok };
