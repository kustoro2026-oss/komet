// TikTok Publisher
// Posts videos to TikTok via Direct Post API v2 using PULL_FROM_URL
//
// API docs: https://developers.tiktok.com/doc/content-posting-api/

interface TikTokInitResponse {
  data?: {
    publish_id: string;
    upload_url?: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

interface TikTokStatusResponse {
  data?: {
    status: string; // PROCESSING_UPLOAD, SENDING_TO_PUBLISH, PUBLISH_COMPLETE, FAILED
    fail_reason?: string;
    publicaly_post_id?: string;
    publicaly_post_url?: string;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

/**
 * Publish a video to TikTok using PULL_FROM_URL (TikTok downloads the video).
 * @param accessToken - OAuth 2.0 access token with video.publish scope
 * @param caption - Video caption/description (max 2,200 chars)
 * @param videoUrl - Publicly accessible URL of the video file
 */
export async function publishToTikTok(
  accessToken: string,
  caption: string,
  videoUrl: string,
): Promise<{ success: boolean; postId?: string; status?: string; error?: string }> {
  try {
    if (!accessToken) {
      return { success: false, error: "No access token" };
    }

    if (!videoUrl) {
      return { success: false, error: "No video URL — TikTok requires video content" };
    }

    // Step 1: Initialize video upload
    const initResponse = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title: caption.slice(0, 2200), // TikTok caption limit
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000, // Cover from 1s into video
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: videoUrl,
          },
        }),
      }
    );

    const initData: TikTokInitResponse = await initResponse.json();

    if (!initResponse.ok || !initData.data?.publish_id) {
      const errMsg = initData.error?.message || `HTTP ${initResponse.status}`;
      console.error("[TikTok Publisher] Init failed:", JSON.stringify(initData));
      return { success: false, error: errMsg };
    }

    const publishId = initData.data.publish_id;
    console.log(`[TikTok Publisher] Init OK, publish_id=${publishId}`);

    // Step 2: Poll briefly for completion
    // TikTok PULL_FROM_URL takes 10–60s; Vercel serverless limit is 10s
    // Return processing status — user refreshes page in 1-2 min to see result
    const publicPostId = await pollTikTokStatus(accessToken, publishId, 2);

    if (publicPostId) {
      return { success: true, postId: publicPostId };
    }

    // Init succeeded but polling didn't complete — video is still processing on TikTok
    console.log(`[TikTok Publisher] Init OK, processing in background: ${publishId}`);
    return { success: true, postId: publishId, status: "processing" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "TikTok API request failed",
    };
  }
}

/**
 * Poll TikTok for publish status until complete or timeout.
 */
async function pollTikTokStatus(
  accessToken: string,
  publishId: string,
  maxAttempts: number = 12,
): Promise<string | null> {
  // TikTok typically takes 10-60 seconds to process PULL_FROM_URL
  // We poll briefly within Vercel serverless timeout (10s limit)
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(3000); // Wait 3 seconds between polls

    try {
      const response = await fetch(
        "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publish_id: publishId }),
        }
      );

      const data: TikTokStatusResponse = await response.json();

      console.log(
        `[TikTok Publisher] Status check ${attempt}/${maxAttempts}: ${data.data?.status}`
      );

      if (data.error) {
        console.error("[TikTok Publisher] Status error:", JSON.stringify(data.error));
        return null; // Fatal error
      }

      if (data.data?.status === "PUBLISH_COMPLETE") {
        return data.data.publicaly_post_id || publishId;
      }

      if (data.data?.status === "FAILED") {
        console.error(
          "[TikTok Publisher] Publish failed:",
          data.data.fail_reason
        );
        return null;
      }

      // Continue polling for PROCESSING_UPLOAD, SENDING_TO_PUBLISH, etc.
    } catch (err) {
      console.error("[TikTok Publisher] Status poll error:", err);
      // Continue polling despite transient errors
    }
  }

  console.error(`[TikTok Publisher] Timeout after ${maxAttempts} attempts`);
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
