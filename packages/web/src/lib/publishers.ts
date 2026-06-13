// Inline publisher functions for social media platforms.
// Moved to @komet/web after removing the @komet/api package.

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

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
  maxAttempts = 12,
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
        const errBody = await res.text().catch(() => "");
        console.error(
          "[TikTok Publisher] Status check error:",
          res.status,
          errBody,
        );
        return { status: "FAILED" };
      }

      const data = (await res.json()) as { data?: { status?: string; publish_id?: string; fail_reason?: string } };
      const status = data.data?.status || "";
      console.log(
        `[TikTok Publisher] Status check ${attempt + 1}/${maxAttempts}: ${status}`,
        JSON.stringify(data.data),
      );

      if (status === "PUBLISH_COMPLETE") {
        return { status: "PUBLISH_COMPLETE", postId: data.data?.publish_id };
      }

      if (status === "FAILED") {
        console.error("[TikTok Publisher] FAILED with reason:", data.data?.fail_reason);
        return { status: "FAILED" };
      }

      // Still processing — wait with increasing delay (3s, 5s, 5s, 5s...)
      const waitMs = attempt === 0 ? 3000 : 5000;
      await delay(waitMs);
    } catch (err: unknown) {
      console.error("[TikTok Publisher] Status check network error:", (err as Error)?.message);
      await delay(5000);
    }
  }

  return { status: "PROCESSING_UPLOAD", postId: publishId };
}

// ─── Discord (webhook) ─────────────────────────────────────
// Uses webhook.incoming OAuth scope → Discord auto-creates webhook during auth.
// The webhook URL is stored as accessToken in the DB.

interface DiscordPublishResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function publishToDiscord(
  webhookUrl: string,
  content: string,
): Promise<DiscordPublishResult> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("[Discord Webhook] Error:", res.status, err);
      return { success: false, error: `Discord webhook error: ${res.status}` };
    }

    const data = (await res.json()) as { id?: string };
    console.log("[Discord Webhook] Message sent, id:", data.id);
    return { success: true, messageId: data.id };
  } catch (err: unknown) {
    console.error("[Discord Webhook] Error:", (err as Error)?.message);
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

async function publishToTikTok(
  accessToken: string,
  caption: string,
  videoUrl: string,
): Promise<{ success: boolean; postId?: string; error?: string; status?: string }> {
  try {
    // Step 1: Init content publishing (Direct Post API)
    console.log("[TikTok Publisher] Init publish...");
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: caption || "Posted via Komet",
          privacy_level: "SELF_ONLY",
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
          brand_content_toggle: false,
          brand_organic_toggle: false,
          is_aigc: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: videoUrl,
        },
      }),
    });

    if (!initRes.ok) {
      const errText = await initRes.text().catch(() => "");
      console.error("[TikTok Publisher] Init error:", initRes.status, errText);
      let errMsg = `TikTok init error: ${initRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message || errJson?.error || errMsg;
      } catch {}
      return { success: false, error: errMsg };
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

// ─── Telegram (Userbot via MTProto) ─────────────────────────────
// Uses gramjs with session string from phone login.
// Posts text messages to the selected chat.

const TG_API_ID = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const TG_API_HASH = process.env.TELEGRAM_API_HASH || "";

interface TelegramPublishResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

async function publishToTelegram(
  sessionString: string,
  text: string,
  chatId?: string,
): Promise<TelegramPublishResult> {
  if (!TG_API_ID || !TG_API_HASH) {
    return { success: false, error: "Telegram API credentials not configured" };
  }

  try {
    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, TG_API_ID, TG_API_HASH, {
      connectionRetries: 2,
    });

    await client.connect();

    try {
      let peer: string | number = "me";
      if (chatId && chatId !== "me") {
        // Parse numeric chat ID (can be negative for groups/channels)
        peer = parseInt(chatId, 10);
        if (isNaN(peer)) {
          peer = chatId;
        }
      }

      const result = await client.sendMessage(peer, { message: text });
      const messageId = (result as unknown as { id?: number })?.id;

      return { success: true, messageId };
    } finally {
      await client.disconnect().catch(() => {});
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    console.error("[Telegram Publisher]", msg);
    return { success: false, error: msg };
  }
}

export { publishToTwitter, publishToTikTok, publishToDiscord, publishToTelegram };
