// Inline publisher functions for social media platforms.
// Moved to @komet/web after removing the @komet/api package.

import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import * as crypto from "crypto";

// ─── Twitter ───────────────────────────────────────────────────────

interface TwitterPublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

async function publishToTwitter(accessToken: string, text: string): Promise<TwitterPublishResult> {
  try {
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const body = await res.text();
      let errMsg: string;
      try {
        const parsed = JSON.parse(body);
        // X API v2 returns errors in array: { errors: [{ message: "...", code: ... }] }
        // Or sometimes: { detail: "...", title: "...", type: "..." }
        if (parsed.errors?.[0]?.message) {
          errMsg = parsed.errors[0].message;
        } else if (parsed.detail) {
          errMsg = parsed.detail;
        } else if (parsed.title) {
          errMsg = parsed.title;
        } else {
          errMsg = `Twitter API error: ${res.status} ${body.slice(0, 200)}`;
        }
      } catch {
        errMsg = `Twitter API error: ${res.status} ${body.slice(0, 200)}`;
      }
      console.error("[Twitter Publisher] Error:", res.status, errMsg);
      return { success: false, error: errMsg };
    }

    const data = (await res.json()) as { data: { id: string } };
    return { success: true, postId: data.data.id };
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "Network error";
    console.error("[Twitter Publisher] Exception:", msg);
    return { success: false, error: msg };
  }
}

// ─── YouTube ───────────────────────────────────────────────────────

interface YouTubePublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Refresh an expired Google/YouTube OAuth token.
 * Returns the new access token, or null if refresh fails.
 */
async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID || "",
        client_secret: process.env.YOUTUBE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[Google Token Refresh] Error:", res.status, errBody.slice(0, 200));
      return null;
    }

    const data = (await res.json()) as { access_token: string; expires_in?: number };
    console.log("[Google Token Refresh] Success, new token obtained, expires_in:", data.expires_in);
    return data.access_token;
  } catch (err: unknown) {
    console.error("[Google Token Refresh] Exception:", (err as Error)?.message);
    return null;
  }
}

async function publishToYouTube(
  accessToken: string,
  title: string,
  description: string,
  videoUrl?: string,
  tags?: string[],
): Promise<YouTubePublishResult> {
  try {
    if (!videoUrl) {
      console.error("[YouTube Publisher] No video URL provided");
      return { success: false, error: "YouTube publishing requires a video file. Please attach a media file to your post." };
    }

    console.log("[YouTube Publisher] Downloading video from:", videoUrl);

    // Step 1: Download the video from the media URL
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      return { success: false, error: `Failed to download video from storage: ${videoRes.status}` };
    }

    const videoBuffer = await videoRes.arrayBuffer();
    const videoSize = videoBuffer.byteLength;
    const contentType = videoRes.headers.get("content-type") || "video/mp4";

    console.log("[YouTube Publisher] Video downloaded, size:", videoSize, "type:", contentType);

    // Step 2: Initiate resumable upload — get upload URL
    const metadata = {
      snippet: {
        title: title || "Posted via Komet",
        description: description || "",
        tags: tags || [],
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "unlisted",
        selfDeclaredMadeForKids: false,
      },
    };

    console.log("[YouTube Publisher] Initiating resumable upload...");

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Length": String(videoSize),
          "X-Upload-Content-Type": contentType,
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!initRes.ok) {
      const errBody = await initRes.text().catch(() => "");
      let errMsg = `YouTube init error: ${initRes.status}`;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed?.error?.message || parsed?.error?.errors?.[0]?.message || errMsg;
      } catch {}
      console.error("[YouTube Publisher] Init error:", initRes.status, errBody.slice(0, 300));
      return { success: false, error: errMsg };
    }

    // Step 3: Get the upload URL from Location header
    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) {
      console.error("[YouTube Publisher] No Location header in init response");
      return { success: false, error: "No upload URL returned from YouTube" };
    }

    console.log("[YouTube Publisher] Upload URL obtained, uploading video...");

    // Step 4: Upload the video binary
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(videoSize),
        "Content-Type": contentType,
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text().catch(() => "");
      console.error("[YouTube Publisher] Upload error:", uploadRes.status, errBody.slice(0, 300));
      let errMsg = `YouTube upload error: ${uploadRes.status}`;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed?.error?.message || errMsg;
      } catch {}
      return { success: false, error: errMsg };
    }

    // Step 5: Parse response to get video ID
    const uploadData = (await uploadRes.json()) as { id?: string };
    const videoId = uploadData?.id;

    if (!videoId) {
      return { success: false, error: "No video ID returned after upload" };
    }

    console.log("[YouTube Publisher] Upload complete, video ID:", videoId);
    return { success: true, postId: videoId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    console.error("[YouTube Publisher] Exception:", msg);
    return { success: false, error: msg };
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
  mediaUrl?: string,
  username?: string,
  avatarUrl?: string,
): Promise<DiscordPublishResult> {
  try {
    // Add ?wait=true to get message object back (otherwise Discord returns 204 No Content)
    const url = webhookUrl.includes("?")
      ? `${webhookUrl}&wait=true`
      : `${webhookUrl}?wait=true`;

    const payload: Record<string, unknown> = { content };

    // Set webhook sender name to the user's Discord username
    if (username) {
      payload.username = username;
    }
    if (avatarUrl) {
      payload.avatar_url = avatarUrl;
    }

    // If there's a media URL, add as embed (Discord webhook supports image embeds)
    if (mediaUrl) {
      payload.embeds = [
        {
          image: { url: mediaUrl },
        },
      ];
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("[Discord Webhook] Error:", res.status, err);
      return { success: false, error: `Discord webhook error: ${res.status}` };
    }

    // Handle empty response (204 No Content without wait=true) or parse JSON
    const text = await res.text().catch(() => "");
    if (!text.trim()) {
      console.log("[Discord Webhook] Message sent (no body returned)");
      return { success: true };
    }
    try {
      const data = JSON.parse(text) as { id?: string };
      console.log("[Discord Webhook] Message sent, id:", data.id);
      return { success: true, messageId: data.id };
    } catch {
      // Response was not JSON but request succeeded
      console.log("[Discord Webhook] Message sent (non-JSON response)");
      return { success: true };
    }
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
  mediaUrl?: string,
): Promise<TelegramPublishResult> {
  if (!TG_API_ID || !TG_API_HASH) {
    return { success: false, error: "Telegram API credentials not configured" };
  }

  console.log("[Telegram Publisher] publishToTelegram called with chatId:", chatId || "(undefined)", "mediaUrl:", mediaUrl ? "yes" : "no");

  // If chatId is a phone number (starts with +), default to "me".
  // Phone numbers are not valid chat destinations.
  let effectiveChatId = chatId;
  if (effectiveChatId && effectiveChatId.startsWith("+")) {
    console.log("[Telegram Publisher] chatId is a phone number, defaulting to Saved Messages");
    effectiveChatId = "me";
  }

  try {
    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, TG_API_ID, TG_API_HASH, {
      connectionRetries: 2,
    });

    await client.connect();

    try {
      // Fetch dialogs to populate entity cache AND to search for the target.
      const dialogs = await client.getDialogs({ limit: 200 });

      // Parse chatId — may contain topic ID in format "chatId|topicId"
      let peer: string | number = "me";
      let forumTopicId: number | undefined;
      if (effectiveChatId && effectiveChatId !== "me") {
        const pipeIdx = effectiveChatId.indexOf("|");
        const actualChatId = pipeIdx >= 0 ? effectiveChatId.substring(0, pipeIdx) : effectiveChatId;
        if (pipeIdx >= 0) {
          forumTopicId = parseInt(effectiveChatId.substring(pipeIdx + 1), 10) || undefined;
        }
        const numericId = parseInt(actualChatId, 10);
        peer = isNaN(numericId) ? actualChatId : numericId;
      }

      // Resolve peer: prefer username resolution (most reliable for userbots).
      // GramJS userbots often fail to resolve raw numeric IDs for entities
      // they haven't interacted with recently. Resolving by username first
      // forces the server to return a fresh, valid peer reference.
      let resolvedPeer: Parameters<typeof client.sendMessage>[0] = "me";
      let foundInDialogs = false;

      if (peer !== "me") {
        const targetId = String(peer);
        for (const dialog of dialogs) {
          const entity = dialog.entity;
          if (!entity) continue;
          const entityId = String((entity as unknown as { id?: { toString(): string } }).id ?? "");
          if (entityId === targetId) {
            foundInDialogs = true;
            const username = (entity as unknown as { username?: string }).username;

            if (username) {
              // Resolve by username — forces server to return a valid, fresh peer.
              // Extract accessHash from the resolved entity so we can construct
              // a proper InputPeer (critical for Channels/forums).
              console.log("[Telegram Publisher] Resolving by username:", username);
              const resolved = await client.getEntity(username);
              const resolvedClass = (resolved as { className?: string }).className || "";
              if (resolvedClass === "Channel") {
                const ch = resolved as unknown as { id?: { toString(): string }; accessHash?: { value?: unknown } };
                console.log("[Telegram Publisher] Resolved Channel, accessHash:", ch.accessHash?.value);
                /* eslint-disable @typescript-eslint/no-explicit-any */
                resolvedPeer = new Api.InputPeerChannel({
                  channelId: (ch.id?.toString() ?? entityId) as any,
                  accessHash: (ch.accessHash?.value ?? 0) as any,
                });
                /* eslint-enable @typescript-eslint/no-explicit-any */
              } else {
                resolvedPeer = resolved as Parameters<typeof client.sendMessage>[0];
              }
            } else {
              // No username available — construct InputPeer from entity details
              const className = (entity as { className?: string }).className || "";
              console.log("[Telegram Publisher] No username, className:", className, "— constructing InputPeer");
              /* eslint-disable @typescript-eslint/no-explicit-any */
              if (className === "Chat") {
                resolvedPeer = new Api.InputPeerChat({ chatId: entityId as any });
              } else if (className === "Channel") {
                const ch = entity as unknown as { accessHash?: { value?: unknown } };
                resolvedPeer = new Api.InputPeerChannel({
                  channelId: entityId as any,
                  accessHash: (ch.accessHash?.value ?? 0) as any,
                });
              } else {
                resolvedPeer = dialog.inputEntity;
              }
              /* eslint-enable @typescript-eslint/no-explicit-any */
            }
            break;
          }
        }
      }

      // Fallback: resolve entity from server via getEntity
      if (!foundInDialogs && peer !== "me") {
        console.log("[Telegram Publisher] Entity not in dialogs, resolving from server:", peer);
        resolvedPeer = await client.getEntity(peer);
      }

      const sendFunc = async (target: typeof resolvedPeer, opts: Record<string, unknown>) => {
        if (mediaUrl) {
          console.log("[Telegram Publisher] Sending with media:", mediaUrl.substring(0, 80));
          return await client.sendFile(target, {
            file: mediaUrl,
            caption: text || undefined,
            replyTo: opts.replyTo as number | undefined,
          });
        }
        return await client.sendMessage(target, {
          message: text,
          replyTo: opts.replyTo as number | undefined,
        });
      };

      const sendOpts: Record<string, unknown> = {};
      if (forumTopicId) {
        console.log("[Telegram Publisher] Sending to explicit topic:", forumTopicId);
        sendOpts.replyTo = forumTopicId;
      }

      // Try to send. If PEER_ID_INVALID, retry with General topic (forum).
      // If that also fails, fall back to "me" (Saved Messages).
      try {
        const result = await sendFunc(resolvedPeer, sendOpts);
        const messageId = (result as unknown as { id?: number })?.id;
        return { success: true, messageId };
      } catch (sendErr: unknown) {
        const sendMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        console.error("[Telegram Publisher] sendMessage failed:", sendMsg);

        if (sendMsg.includes("PEER_ID_INVALID") && !sendOpts.replyTo) {
          console.log("[Telegram Publisher] Retrying with General topic (forum group)");
          sendOpts.replyTo = 1;
          try {
            const retryResult = await sendFunc(resolvedPeer, sendOpts);
            const retryMessageId = (retryResult as unknown as { id?: number })?.id;
            return { success: true, messageId: retryMessageId };
          } catch (retryErr: unknown) {
            console.error("[Telegram Publisher] Retry also failed:", retryErr instanceof Error ? retryErr.message : String(retryErr));
          }
        }

        // Ultimate fallback: send to "me" (Saved Messages) if peer was not "me"
        if (peer !== "me") {
          console.log("[Telegram Publisher] Falling back to Saved Messages");
          try {
            const fbResult = await sendFunc("me", { message: text });
            const fbMessageId = (fbResult as unknown as { id?: number })?.id;
            return { success: true, messageId: fbMessageId };
          } catch (fbErr: unknown) {
            console.error("[Telegram Publisher] Fallback to 'me' also failed:", fbErr instanceof Error ? fbErr.message : String(fbErr));
          }
        }

        throw sendErr;
      }
    } finally {
      await client.disconnect().catch(() => {});
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    console.error("[Telegram Publisher]", msg);
    return { success: false, error: msg };
  }
}

// ─── Pinterest ────────────────────────────────────────────────────

interface PinterestPublishResult {
  success: boolean;
  pinId?: string;
  error?: string;
}

/**
 * Publish a pin to Pinterest.
 * Uses boards:write and pins:write scopes.
 * boardId should be stored in platformAccountId.
 */
async function publishToPinterest(
  accessToken: string,
  text: string,
  boardId?: string,
  mediaUrl?: string,
): Promise<PinterestPublishResult> {
  if (!boardId) {
    return { success: false, error: "No board selected. Please reconnect Pinterest." };
  }
  if (!mediaUrl) {
    return { success: false, error: "Pinterest requires an image. Attach an image to your post." };
  }

  try {
    // Split text: first line as title (max 100 chars), rest as description
    const lines = text.split("\n");
    const title = lines[0]?.substring(0, 100) || "New Pin";
    const description = lines.slice(1).join("\n").substring(0, 500);

    const pinterestApiBase = process.env.PINTEREST_API_BASE_URL || "https://api-sandbox.pinterest.com";
    console.log("[Pinterest Pin] API base:", pinterestApiBase, "| env var:", process.env.PINTEREST_API_BASE_URL, "| token prefix:", accessToken?.substring(0, 10));
    const res = await fetch(`${pinterestApiBase}/v5/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: boardId,
        title,
        description,
        media_source: {
          source_type: "image_url",
          url: mediaUrl,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("[Pinterest Pin] Error:", res.status, err);
      return { success: false, error: `Pinterest error: ${res.status} ${err.substring(0, 200)}` };
    }

    const data = (await res.json()) as { id?: string };
    console.log("[Pinterest Pin] Created, id:", data.id);
    return { success: true, pinId: data.id };
  } catch (err: unknown) {
    console.error("[Pinterest Pin] Error:", (err as Error)?.message);
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── LinkedIn ────────────────────────────────────────────────────

interface LinkedInPublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Publish a text post to LinkedIn personal profile.
 * Uses w_member_social scope.
 * platformAccountId stores the LinkedIn person ID (sub from OpenID).
 */
async function publishToLinkedIn(
  accessToken: string,
  text: string,
  personId?: string,
  mediaUrl?: string,
): Promise<LinkedInPublishResult> {
  if (!personId) {
    return { success: false, error: "No LinkedIn profile ID. Please reconnect." };
  }

  try {
    const author = `urn:li:person:${personId}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": "202606",
    };

    let imageUrn: string | undefined;

    // If mediaUrl is provided, upload image via 3-step LinkedIn flow
    if (mediaUrl) {
      try {
        // Step 1: Register image upload
        const registerRes = await fetch(
          "https://api.linkedin.com/rest/images?action=initializeUpload",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              initializeUploadRequest: {
                owner: author,
              },
            }),
          }
        );

        if (!registerRes.ok) {
          const regErr = await registerRes.text().catch(() => "");
          console.error("[LinkedIn Media] Register upload failed:", registerRes.status, regErr);
        } else {
          const regData = (await registerRes.json()) as {
            value?: { uploadUrl?: string; image?: string };
          };
          const uploadUrl = regData?.value?.uploadUrl;
          imageUrn = regData?.value?.image;

          if (uploadUrl && imageUrn) {
            // Step 2: Download image from mediaUrl
            const imgRes = await fetch(mediaUrl);
            if (!imgRes.ok) {
              console.error("[LinkedIn Media] Failed to download image from:", mediaUrl);
              imageUrn = undefined;
            } else {
              const imgBuffer = await imgRes.arrayBuffer();

              // Upload binary to LinkedIn
              const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": "image/jpeg" },
                body: imgBuffer,
              });

              if (!uploadRes.ok) {
                const upErr = await uploadRes.text().catch(() => "");
                console.error("[LinkedIn Media] Binary upload failed:", uploadRes.status, upErr);
                imageUrn = undefined;
              } else {
                console.log("[LinkedIn Media] Image uploaded successfully:", imageUrn);
              }
            }
          }
        }
      } catch (mediaErr) {
        console.error("[LinkedIn Media] Error during image upload:", (mediaErr as Error)?.message);
        // Continue with text-only post if image upload fails
        imageUrn = undefined;
      }
    }

    // Step 3: Create post (with or without media)
    const postBody: Record<string, unknown> = {
      author,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    if (imageUrn) {
      postBody.content = {
        media: {
          id: imageUrn,
          altText: "Image posted from Komet",
        },
      };
    }

    const res = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers,
      body: JSON.stringify(postBody),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("[LinkedIn Post] Error:", res.status, err);
      return { success: false, error: `LinkedIn error: ${res.status} ${err.substring(0, 200)}` };
    }

    // Post ID is in x-restli-id response header
    const postId = res.headers.get("x-restli-id") || "";
    console.log("[LinkedIn Post] Created, id:", postId);
    return { success: true, postId };
  } catch (err: unknown) {
    console.error("[LinkedIn Post] Error:", (err as Error)?.message);
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── Snapchat ─────────────────────────────────────────────────────
// Uses Snapchat Public Profile API (Marketing API OAuth)
// Docs: https://www.ayrshare.com/complete-guide-to-snapchat-api-integration/
// Requires: snapchat-profile-api scope, AES-256-CBC encrypted media upload

interface SnapchatPublishResult {
  success: boolean;
  storyId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Upload media to Snapchat with AES-256-CBC encryption.
 * Returns the media_id needed for story creation.
 */
async function uploadSnapchatMedia(
  accessToken: string,
  profileId: string,
  mediaUrl: string,
): Promise<string> {
  // Determine media type from URL extension
  const isVideo = /\.(mp4|mov|webm)$/i.test(mediaUrl);
  const mediaType = isVideo ? "VIDEO" : "IMAGE";

  // Generate AES-256-CBC encryption key & IV
  const key = crypto.randomBytes(32); // 256 bits
  const iv = crypto.randomBytes(16);  // 128 bits

  console.log("[Snapchat Media] Creating container, type:", mediaType);

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://businessapi.snapchat.com/v1/public_profiles/${profileId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: mediaType,
        name: `komet-media-${Date.now()}`,
        key: key.toString("base64"),
        iv: iv.toString("base64"),
      }),
    },
  );

  if (!containerRes.ok) {
    const errText = await containerRes.text().catch(() => "");
    console.error("[Snapchat Media] Container error:", containerRes.status, errText);
    throw new Error(`Snapchat media container failed: ${containerRes.status} ${errText.slice(0, 200)}`);
  }

  const containerData = (await containerRes.json()) as {
    media_id?: string;
    upload_urls?: string[];
    upload_url?: string;
  };

  const mediaId = containerData.media_id;
  if (!mediaId) {
    throw new Error("No media_id returned from Snapchat container");
  }

  console.log("[Snapchat Media] Container created, media_id:", mediaId);

  // Step 2: Download the media from our storage
  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok) {
    throw new Error(`Failed to download media from storage: ${mediaRes.status}`);
  }
  const mediaBuffer = Buffer.from(await mediaRes.arrayBuffer());
  console.log("[Snapchat Media] Downloaded, size:", mediaBuffer.length, "bytes");

  // Step 3: Encrypt with AES-256-CBC
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(mediaBuffer), cipher.final()]);
  console.log("[Snapchat Media] Encrypted, size:", encrypted.length, "bytes");

  // Step 4: Upload encrypted media to Snapchat
  const uploadUrls = containerData.upload_urls || (containerData.upload_url ? [containerData.upload_url] : []);

  if (uploadUrls.length === 0) {
    // No upload URLs — some API versions embed upload in container creation
    console.log("[Snapchat Media] No upload URLs — assuming direct upload or auto-finalize");
  } else if (uploadUrls.length === 1) {
    // Single URL: upload all at once
    const upRes = await fetch(uploadUrls[0], {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: encrypted,
    });
    if (!upRes.ok) {
      const upErr = await upRes.text().catch(() => "");
      console.error("[Snapchat Media] Upload error:", upRes.status, upErr);
      throw new Error(`Snapchat media upload failed: ${upRes.status}`);
    }
    console.log("[Snapchat Media] Uploaded to single URL, status:", upRes.status);
  } else {
    // Multiple URLs: split encrypted data into chunks
    const chunkSize = Math.ceil(encrypted.length / uploadUrls.length);
    for (let i = 0; i < uploadUrls.length; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, encrypted.length);
      const chunk = encrypted.subarray(start, end);
      const upRes = await fetch(uploadUrls[i], {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk,
      });
      if (!upRes.ok) {
        const upErr = await upRes.text().catch(() => "");
        console.error(`[Snapchat Media] Chunk ${i + 1}/${uploadUrls.length} error:`, upRes.status, upErr);
        throw new Error(`Snapchat media chunk upload failed: ${upRes.status}`);
      }
    }
    console.log(`[Snapchat Media] Uploaded ${uploadUrls.length} chunks`);
  }

  return mediaId;
}

/**
 * Publish a Story or Spotlight to Snapchat Public Profile.
 * profileId must be the Snapchat Public Profile ID.
 */
async function publishToSnapchat(
  accessToken: string,
  profileId: string,
  mediaUrl: string,
  caption?: string,
): Promise<SnapchatPublishResult> {
  if (!profileId) {
    return {
      success: false,
      error: "No Snapchat Public Profile connected. Create a Public Profile in Snapchat Business Manager and reconnect.",
    };
  }

  if (!mediaUrl) {
    return {
      success: false,
      error: "Snapchat requires an image or video. Please attach media to your post.",
    };
  }

  try {
    // Step 1: Upload & encrypt media
    console.log("[Snapchat Publisher] Uploading media...");
    const mediaId = await uploadSnapchatMedia(accessToken, profileId, mediaUrl);
    console.log("[Snapchat Publisher] Media uploaded, id:", mediaId);

    // Step 2: Create story
    const publishUrl = `https://businessapi.snapchat.com/v1/public_profiles/${profileId}/stories`;
    const publishBody: Record<string, unknown> = { media_id: mediaId };
    if (caption) {
      publishBody.caption = caption;
    }

    console.log("[Snapchat Publisher] Creating story...");
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(publishBody),
    });

    if (!publishRes.ok) {
      const errText = await publishRes.text().catch(() => "");
      console.error("[Snapchat Publisher] Publish error:", publishRes.status, errText);
      return { success: false, error: `Snapchat publish error: ${publishRes.status} ${errText.slice(0, 200)}` };
    }

    const publishData = (await publishRes.json()) as {
      request_status?: string;
      stories?: Array<{ story?: { id?: string } }>;
    };

    if (publishData.request_status !== "SUCCESS") {
      return {
        success: false,
        error: `Snapchat publish failed: ${JSON.stringify(publishData)}`,
      };
    }

    const storyId = publishData.stories?.[0]?.story?.id;
    const postUrl = storyId
      ? `https://www.snapchat.com/add/spotlight/${storyId}`
      : undefined;

    console.log("[Snapchat Publisher] Published! storyId:", storyId);
    return { success: true, storyId, postUrl };
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "Network error";
    console.error("[Snapchat Publisher] Exception:", msg);
    return { success: false, error: msg };
  }
}

export { publishToTwitter, publishToTikTok, publishToDiscord, publishToTelegram, publishToYouTube, refreshGoogleToken, publishToPinterest, publishToLinkedIn, publishToSnapchat };
