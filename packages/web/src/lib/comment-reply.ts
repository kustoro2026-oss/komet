// Platform-specific comment fetching and reply functions for auto-reply.
// Each platform has:
//   - fetch{Platform}Comments()  — get recent comments on a user's post
//   - replyTo{Platform}Comment() — post a reply to a comment
//
// Documentation references:
//   Twitter/X:  https://developer.x.com/en/docs/x-api
//   Instagram:  https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments/
//   Facebook:   https://developers.facebook.com/docs/pages-api/comments-mentions/
//   LinkedIn:   https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api
//   YouTube:    https://developers.google.com/youtube/v3/docs/comments/insert
//   TikTok:     https://business-api.tiktok.com/portal/docs (reply only; fetch requires Research API)
//   Reddit:     https://www.reddit.com/dev/api/

// ─── Types ────────────────────────────────────────────────────────

export interface CommentResult {
  id: string;
  text: string;
  authorName: string;
  authorId?: string;
  timestamp: string;
  /** Platform-specific parent ID needed for replies (e.g. tweet ID, media ID) */
  parentPostId?: string;
}

export interface ReplyResult {
  success: boolean;
  replyId?: string;
  error?: string;
}

export interface FetchCommentsParams {
  accessToken: string;
  /** The post ID on the platform (tweet ID, media ID, video ID, etc.) */
  postId: string;
  /** Extra platform-specific parameters */
  extra?: Record<string, string>;
}

// ─── Twitter/X ────────────────────────────────────────────────────

export async function fetchTwitterComments(
  accessToken: string,
  tweetId: string,
): Promise<CommentResult[]> {
  const url = `https://api.x.com/2/tweets/search/recent?query=conversation_id:${tweetId}&tweet.fields=author_id,text,created_at&max_results=50`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[Twitter FetchComments] Error:", res.status, errBody.slice(0, 300));
    return [];
  }

  const data = (await res.json()) as {
    data?: Array<{ id: string; text: string; author_id?: string; created_at?: string }>;
    includes?: { users?: Array<{ id: string; username: string; name: string }> };
  };

  if (!data.data?.length) return [];

  const userMap = new Map<string, string>();
  for (const u of data.includes?.users || []) {
    userMap.set(u.id, u.name || u.username);
  }

  return data.data.map((tweet) => ({
    id: tweet.id,
    text: tweet.text,
    authorName: userMap.get(tweet.author_id || "") || tweet.author_id || "unknown",
    authorId: tweet.author_id,
    timestamp: tweet.created_at || new Date().toISOString(),
    parentPostId: tweetId,
  }));
}

export async function replyToTwitterComment(
  accessToken: string,
  tweetId: string,
  text: string,
): Promise<ReplyResult> {
  try {
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        reply: { in_reply_to_tweet_id: tweetId },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      let errMsg = `Twitter API error: ${res.status}`;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed.errors?.[0]?.message || parsed.detail || errMsg;
      } catch { /* use default */ }
      console.error("[Twitter Reply] Error:", res.status, errBody.slice(0, 300));
      return { success: false, error: errMsg };
    }

    const data = (await res.json()) as { data?: { id: string } };
    return { success: true, replyId: data.data?.id };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── Instagram ────────────────────────────────────────────────────

const IG_API_VERSION = "v25.0";

export async function fetchInstagramComments(
  accessToken: string,
  mediaId: string,
): Promise<CommentResult[]> {
  const url = `https://graph.facebook.com/${IG_API_VERSION}/${mediaId}/comments?fields=id,text,timestamp,from,replies`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[Instagram FetchComments] Error:", res.status, errBody.slice(0, 300));
    return [];
  }

  const data = (await res.json()) as {
    data?: Array<{
      id: string;
      text: string;
      timestamp?: string;
      from?: { id?: string; username?: string };
      replies?: { data?: Array<{ id: string; text: string; timestamp?: string; from?: { id?: string; username?: string } }> };
    }>;
  };

  if (!data.data?.length) return [];

  const comments: CommentResult[] = [];
  for (const c of data.data) {
    comments.push({
      id: c.id,
      text: c.text,
      authorName: c.from?.username || "unknown",
      authorId: c.from?.id,
      timestamp: c.timestamp || new Date().toISOString(),
      parentPostId: mediaId,
    });
    // Include replies as top-level for keyword matching
    for (const r of c.replies?.data || []) {
      comments.push({
        id: r.id,
        text: r.text,
        authorName: r.from?.username || "unknown",
        authorId: r.from?.id,
        timestamp: r.timestamp || new Date().toISOString(),
        parentPostId: mediaId,
      });
    }
  }
  return comments;
}

export async function replyToInstagramComment(
  accessToken: string,
  commentId: string,
  text: string,
): Promise<ReplyResult> {
  try {
    const url = `https://graph.facebook.com/${IG_API_VERSION}/${commentId}/replies`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: new URLSearchParams({ message: text }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[Instagram Reply] Error:", res.status, errBody.slice(0, 300));
      return { success: false, error: `Instagram error: ${res.status} ${errBody.slice(0, 200)}` };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, replyId: data.id };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── Facebook ─────────────────────────────────────────────────────

export async function fetchFacebookComments(
  accessToken: string,
  postId: string,
): Promise<CommentResult[]> {
  const url = `https://graph.facebook.com/${IG_API_VERSION}/${postId}/comments?fields=id,message,created_time,from`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[Facebook FetchComments] Error:", res.status, errBody.slice(0, 300));
    return [];
  }

  const data = (await res.json()) as {
    data?: Array<{
      id: string;
      message?: string;
      created_time?: string;
      from?: { id?: string; name?: string };
    }>;
  };

  if (!data.data?.length) return [];

  return data.data.map((c) => ({
    id: c.id,
    text: c.message || "",
    authorName: c.from?.name || "unknown",
    authorId: c.from?.id,
    timestamp: c.created_time || new Date().toISOString(),
    parentPostId: postId,
  }));
}

export async function replyToFacebookComment(
  accessToken: string,
  commentId: string,
  text: string,
): Promise<ReplyResult> {
  try {
    const url = `https://graph.facebook.com/${IG_API_VERSION}/${commentId}/comments`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: new URLSearchParams({ message: text }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[Facebook Reply] Error:", res.status, errBody.slice(0, 300));
      return { success: false, error: `Facebook error: ${res.status} ${errBody.slice(0, 200)}` };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, replyId: data.id };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── LinkedIn ─────────────────────────────────────────────────────

const LI_API_VERSION = "202606";

function linkedInHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "Linkedin-Version": LI_API_VERSION,
  };
}

export async function fetchLinkedInComments(
  accessToken: string,
  shareUrn: string,
): Promise<CommentResult[]> {
  // shareUrn format: urn:li:activity:123456 or urn:li:share:123456
  const encodedUrn = encodeURIComponent(shareUrn);
  const url = `https://api.linkedin.com/rest/socialActions/${encodedUrn}/comments`;

  const res = await fetch(url, {
    headers: linkedInHeaders(accessToken),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[LinkedIn FetchComments] Error:", res.status, errBody.slice(0, 300));
    return [];
  }

  const data = (await res.json()) as {
    elements?: Array<{
      commentUrn?: string;
      message?: { text?: string };
      actor?: string;
      created?: { time?: number };
      id?: string | number;
    }>;
  };

  if (!data.elements?.length) return [];

  return data.elements.map((c) => ({
    id: c.commentUrn || String(c.id || ""),
    text: c.message?.text || "",
    authorName: c.actor || "unknown",
    timestamp: c.created?.time ? new Date(c.created.time).toISOString() : new Date().toISOString(),
    parentPostId: shareUrn,
  }));
}

export async function replyToLinkedInComment(
  accessToken: string,
  shareUrn: string,
  text: string,
  actorUrn: string,
): Promise<ReplyResult> {
  try {
    const encodedUrn = encodeURIComponent(shareUrn);
    const url = `https://api.linkedin.com/rest/socialActions/${encodedUrn}/comments`;

    const body: Record<string, unknown> = {
      actor: actorUrn,
      message: { text },
      parentComment: encodedUrn,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: linkedInHeaders(accessToken),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[LinkedIn Reply] Error:", res.status, errBody.slice(0, 300));
      return { success: false, error: `LinkedIn error: ${res.status} ${errBody.slice(0, 200)}` };
    }

    const location = res.headers.get("x-restli-id") || res.headers.get("location") || "";
    return { success: true, replyId: location || undefined };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── YouTube ──────────────────────────────────────────────────────

export async function fetchYouTubeComments(
  accessToken: string,
  videoId: string,
): Promise<CommentResult[]> {
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[YouTube FetchComments] Error:", res.status, errBody.slice(0, 300));
    return [];
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      snippet?: {
        topLevelComment?: {
          id: string;
          snippet?: {
            textOriginal?: string;
            authorDisplayName?: string;
            authorChannelId?: { value?: string };
            publishedAt?: string;
          };
        };
      };
    }>;
  };

  if (!data.items?.length) return [];

  return data.items.map((item) => {
    const c = item.snippet?.topLevelComment?.snippet;
    return {
      id: item.snippet?.topLevelComment?.id || item.id,
      text: c?.textOriginal || "",
      authorName: c?.authorDisplayName || "unknown",
      authorId: c?.authorChannelId?.value,
      timestamp: c?.publishedAt || new Date().toISOString(),
      parentPostId: videoId,
    };
  });
}

export async function replyToYouTubeComment(
  accessToken: string,
  commentId: string,
  text: string,
): Promise<ReplyResult> {
  try {
    const url = "https://www.googleapis.com/youtube/v3/comments?part=snippet";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          parentId: commentId,
          textOriginal: text,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[YouTube Reply] Error:", res.status, errBody.slice(0, 300));
      return { success: false, error: `YouTube error: ${res.status} ${errBody.slice(0, 200)}` };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, replyId: data.id };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── TikTok ───────────────────────────────────────────────────────
// Note: TikTok Business API does NOT support fetching comments from own videos.
// Only the Research API (gated, for academics/non-profits) can read comments.
// We can REPLY if we already have a comment ID (e.g., from a webhook).

export async function replyToTikTokComment(
  accessToken: string,
  videoId: string,
  commentId: string,
  text: string,
  uniqueId?: string,
): Promise<ReplyResult> {
  try {
    const url = "https://open.tiktokapis.com/v2/post/reply/comment/";
    const body: Record<string, unknown> = {
      video_id: videoId,
      comment_id: commentId,
      content: text,
    };
    if (uniqueId) body.unique_id = uniqueId;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[TikTok Reply] Error:", res.status, errBody.slice(0, 300));
      return { success: false, error: `TikTok error: ${res.status} ${errBody.slice(0, 200)}` };
    }

    const data = (await res.json()) as { data?: { comment_id?: string }; error?: { message?: string } };
    if (data.error?.message) {
      return { success: false, error: data.error.message };
    }
    return { success: true, replyId: data.data?.comment_id };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

/**
 * TikTok does NOT support fetching comments via the Business API.
 * This function always returns an empty array with a log message.
 */
export function fetchTikTokComments(
  _accessToken: string,
  _videoId: string,
): Promise<CommentResult[]> {
  console.log("[TikTok FetchComments] Not available via TikTok Business API. Use Research API or webhooks for comment IDs.");
  return Promise.resolve([]);
}

// ─── Reddit ───────────────────────────────────────────────────────

export async function fetchRedditComments(
  accessToken: string,
  subreddit: string,
  articleId: string,
): Promise<CommentResult[]> {
  const url = `https://oauth.reddit.com/r/${subreddit}/comments/${articleId}?limit=50&sort=new`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "komet:v1.0.0 (by /u/komet-app)",
    },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[Reddit FetchComments] Error:", res.status, errBody.slice(0, 300));
    return [];
  }

  // Reddit returns an array: [post listing, comments listing]
  const listings = (await res.json()) as Array<{
    data?: { children?: Array<{ kind: string; data: RedditCommentData }> };
  }>;

  interface RedditCommentData {
    id?: string;
    name?: string;
    author?: string;
    body?: string;
    created_utc?: number;
  }

  const comments: CommentResult[] = [];
  // Second element is the comments listing
  const commentListing = listings[1];
  if (!commentListing?.data?.children) return [];

  const flatten = (children: Array<{ kind: string; data: RedditCommentData }>) => {
    for (const child of children) {
      if (child.kind !== "t1") continue;
      const d = child.data;
      if (!d.id) continue;
      comments.push({
        id: d.name || `t1_${d.id}`,
        text: d.body || "",
        authorName: d.author || "unknown",
        timestamp: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : new Date().toISOString(),
        parentPostId: articleId,
      });
    }
  };

  flatten(commentListing.data.children);
  return comments;
}

export async function replyToRedditComment(
  accessToken: string,
  thingId: string,
  text: string,
): Promise<ReplyResult> {
  try {
    const url = "https://oauth.reddit.com/api/comment";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "komet:v1.0.0 (by /u/komet-app)",
      },
      body: new URLSearchParams({ thing_id: thingId, text, api_type: "json" }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[Reddit Reply] Error:", res.status, errBody.slice(0, 300));
      return { success: false, error: `Reddit error: ${res.status} ${errBody.slice(0, 200)}` };
    }

    // Reddit returns 200 with errors in body — must check json.errors
    const data = (await res.json()) as {
      json?: {
        errors?: Array<[string, string, string]>;
        data?: { things?: Array<{ data?: { id?: string; name?: string } }> };
      };
    };

    const errors = data.json?.errors;
    if (errors && errors.length > 0) {
      // RATELIMIT or other errors
      const errMsgs = errors.map((e) => e[1] || e[0]).join("; ");
      if (errMsgs.includes("RATELIMIT")) {
        console.warn("[Reddit Reply] Rate limited:", errMsgs);
        return { success: false, error: "Reddit rate limit: " + errMsgs };
      }
      return { success: false, error: errMsgs };
    }

    const replyName = data.json?.data?.things?.[0]?.data?.name;
    return { success: true, replyId: replyName || undefined };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || "Network error" };
  }
}

// ─── Dispatcher ───────────────────────────────────────────────────

/**
 * Fetch comments from a platform's post.
 * Returns empty array for platforms where fetching is not supported (e.g. TikTok).
 */
export async function fetchComments(
  platform: string,
  accessToken: string,
  postId: string,
  extra?: Record<string, string>,
): Promise<CommentResult[]> {
  switch (platform) {
    case "twitter":
      return fetchTwitterComments(accessToken, postId);
    case "instagram":
      return fetchInstagramComments(accessToken, postId);
    case "facebook":
      return fetchFacebookComments(accessToken, postId);
    case "linkedin":
      return fetchLinkedInComments(accessToken, postId);
    case "youtube":
      return fetchYouTubeComments(accessToken, postId);
    case "tiktok":
      return fetchTikTokComments(accessToken, postId);
    case "reddit":
      return fetchRedditComments(
        accessToken,
        extra?.subreddit || "all",
        postId,
      );
    default:
      console.warn(`[AutoReply] No comment fetch for platform: ${platform}`);
      return [];
  }
}

/**
 * Reply to a comment on a platform.
 */
export async function replyToComment(
  platform: string,
  accessToken: string,
  commentId: string,
  text: string,
  extra?: Record<string, string>,
): Promise<ReplyResult> {
  switch (platform) {
    case "twitter":
      return replyToTwitterComment(accessToken, commentId, text);
    case "instagram":
      return replyToInstagramComment(accessToken, commentId, text);
    case "facebook":
      return replyToFacebookComment(accessToken, commentId, text);
    case "linkedin":
      // For LinkedIn, commentId IS the shareUrn, extra.actorUrn is the actor
      return replyToLinkedInComment(
        accessToken,
        commentId,
        text,
        extra?.actorUrn || "urn:li:person:unknown",
      );
    case "youtube":
      return replyToYouTubeComment(accessToken, commentId, text);
    case "tiktok":
      return replyToTikTokComment(
        accessToken,
        extra?.videoId || "",
        commentId,
        text,
        extra?.uniqueId,
      );
    case "reddit":
      return replyToRedditComment(accessToken, commentId, text);
    default:
      console.warn(`[AutoReply] No reply handler for platform: ${platform}`);
      return { success: false, error: `Platform "${platform}" not supported for replies` };
  }
}
