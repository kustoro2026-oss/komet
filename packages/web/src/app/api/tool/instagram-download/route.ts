import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface InstagramMedia {
  type: "video" | "image";
  shortcode: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  /** Direct CDN video URL (only for video posts) */
  videoUrl?: string;
  width?: number;
  height?: number;
}

interface InstagramDownloadResponse {
  success: boolean;
  error?: string;
  media?: InstagramMedia;
  /** Multiple media items for carousel/album posts */
  items?: InstagramMedia[];
}

/** Extracts Instagram post shortcode from various URL formats */
function extractShortcode(raw: string): string | null {
  // Normalize: decode, strip protocols, strip query/fragment
  let url = raw.trim();
  try {
    url = decodeURIComponent(url);
  } catch {
    // Already decoded or invalid encoding
  }

  // Handle standalone shortcode (11 chars, alphanumeric + _ -)
  const standalone = url.match(/^([a-zA-Z0-9_-]{11})$/);
  if (standalone) return standalone[1];

  // Strip protocol and query/fragment for cleaner matching
  const cleaned = url.replace(/^https?:\/\//i, "").replace(/[?#].*$/, "");

  // Known Instagram hostnames
  const hostPattern = "(?:www\\.|m\\.|l\\.|web\\.)?instagram\\.com|instagr\\.am";

  // Path patterns — ordered from most specific to least
  const patterns: RegExp[] = [
    // /p/SHORTCODE, /reel/SHORTCODE, /reels/SHORTCODE, /tv/SHORTCODE
    new RegExp(`(?:${hostPattern})\\/(?:p|reel|reels|tv)\\/([a-zA-Z0-9_-]{11})`),
    // /share/p/SHORTCODE, /share/reel/SHORTCODE
    new RegExp(`(?:${hostPattern})\/share\/(?:p|reel|reels)\/([a-zA-Z0-9_-]{11})`),
    // /share/SHORTCODE (direct share)
    new RegExp(`(?:${hostPattern})\/share\/([a-zA-Z0-9_-]{11})(?:\/|$)`),
    // Fallback: any 11-char slug after instagram domain in URL path
    new RegExp(`(?:${hostPattern})\/(?:[a-z]+\/)*([a-zA-Z0-9_-]{11})(?:\/|$)`),
  ];

  for (const pattern of patterns) {
    const m = cleaned.match(pattern);
    if (m) return m[1];
  }

  return null;
}

/**
 * Unescape HTML entities and JSON escape sequences commonly found in
 * Instagram's embedded <script> tags.
 */
function unescapeInstagram(s: string): string {
  return s
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\\//g, "/")
    .replace(/\\n/g, "\n");
}

/** Extract content from an HTML meta tag (og:*) */
function extractMeta(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // property="og:xxx"
  let m = html.match(
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
  );
  if (m) return m[1];
  // name="xxx"
  m = html.match(
    new RegExp(
      `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
  );
  return m ? m[1] : "";
}

/**
 * Common browser-like headers used across all Instagram requests.
 * Mimics a real Chrome browser to avoid being served a login page.
 */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua":
    '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

/** Instagram App ID used for GraphQL API requests */
const IG_APP_ID = "936619743392459";

/**
 * Fetch with timeout helper.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 12000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Main handler ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { success: false, error: "Please paste an Instagram post or reel URL." },
      { status: 400 },
    );
  }

  const shortcode = extractShortcode(url);
  if (!shortcode) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid Instagram URL. Paste a link like instagram.com/p/... or instagram.com/reel/...",
      },
      { status: 400 },
    );
  }

  try {
    // Strategy 1: Instagram GraphQL API (most reliable, returns structured JSON)
    const graphqlResult = await tryGraphQL(shortcode);
    if (graphqlResult) return graphqlResult;

    // Strategy 2: HTML scraping with desktop UA
    const htmlResult = await tryHtmlScraping(shortcode);
    if (htmlResult) return htmlResult;

    // Strategy 3: HTML scraping with mobile UA (different page structure)
    const mobileResult = await tryMobileScraping(shortcode);
    if (mobileResult) return mobileResult;

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not extract media from this post. It may be private, deleted, or Instagram is rate-limiting. Try again in a few minutes.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Instagram download error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Network error. Please check your connection and try again.",
      },
      { status: 200 },
    );
  }
}

// ─── Strategy 1: Instagram GraphQL API ──────────────────────────────

/**
 * Try Instagram's internal GraphQL API.
 * Returns structured JSON with post metadata and media URLs.
 */
async function tryGraphQL(
  shortcode: string,
): Promise<NextResponse | null> {
  try {
    // Instagram's web GraphQL endpoint
    const formBody = new URLSearchParams({
      variables: JSON.stringify({
        shortcode,
        fetch_comment_count: 0,
        child_comment_count: 0,
        parent_comment_count: 0,
      }),
      doc_id: "8845758582189845",
    });

    const response = await fetchWithTimeout(
      "https://www.instagram.com/api/graphql",
      {
        method: "POST",
        headers: {
          ...BROWSER_HEADERS,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-IG-App-ID": IG_APP_ID,
          "X-ASBD-ID": "198387",
          "X-IG-WWW-Claim": "0",
          "X-Requested-With": "XMLHttpRequest",
          Origin: "https://www.instagram.com",
          Referer: `https://www.instagram.com/p/${shortcode}/`,
        },
        body: formBody.toString(),
      },
    );

    if (!response.ok) {
      console.warn(`GraphQL returned ${response.status}`);
      return null;
    }

    const json = await response.json();
    return parseGraphQLResponse(json, shortcode);
  } catch (error) {
    console.warn("GraphQL fetch failed:", error);
    return null;
  }
}

/** Parse Instagram GraphQL response */
function parseGraphQLResponse(
  json: Record<string, unknown>,
  shortcode: string,
): NextResponse | null {
  try {
    const data = (json as Record<string, unknown>).data as
      | Record<string, unknown>
      | undefined;
    if (!data?.xdt_shortcode_media) return null;
    const media = data.xdt_shortcode_media as Record<string, unknown>;

    const isVideo = media.is_video === true;
    const owner = media.owner as Record<string, unknown> | undefined;
    const author = (owner?.username as string) ||
      (owner?.full_name as string) || "Unknown";
    const caption = media.caption as Record<string, unknown> | undefined;
    const title = (caption?.text as string) || "Instagram Post";

    // Dimensions
    const dimensions = media.dimensions as
      | Record<string, number>
      | undefined;
    const width = dimensions?.width;
    const height = dimensions?.height;

    // Handle carousel (album) posts — extract child media items
    const carouselMedia = media.carousel_media as
      | Array<Record<string, unknown>>
      | undefined;
    const sidecarChildren = media.sidecar_children as
      | Array<Record<string, unknown>>
      | undefined;
    const children = carouselMedia || sidecarChildren;

    if (children && children.length > 0) {
      const items: InstagramMedia[] = [];
      for (const child of children) {
        const childIsVideo = child.is_video === true || child.media_type === 2;
        const sources = child.video_versions as
          | Array<Record<string, unknown>>
          | undefined;
        const imageVersions = child.image_versions2 as Record<string, unknown> | undefined;
        const images = imageVersions?.candidates as
          | Array<Record<string, unknown>>
          | undefined;

        const videoUrl = sources?.[0]?.url as string | undefined;
        const imageUrl = images?.[0]?.url as string | undefined;
        const displayUrl = (child.display_url as string) ||
          imageUrl || videoUrl || "";

        items.push({
          type: childIsVideo ? "video" : "image",
          shortcode: (child.shortcode as string) || shortcode,
          title: `${author} on Instagram`,
          author,
          thumbnailUrl: displayUrl,
          videoUrl: childIsVideo ? videoUrl : undefined,
          width: child.original_width as number | undefined,
          height: child.original_height as number | undefined,
        });
      }

      // Return first item as media + all items
      if (items.length === 0) return null;
      return NextResponse.json({
        success: true,
        media: items[0],
        items: items.length > 1 ? items : undefined,
      } satisfies InstagramDownloadResponse);
    }

    // Single media post
    const videoVersions = media.video_versions as
      | Array<Record<string, unknown>>
      | undefined;
    const imageVersionsRaw = media.image_versions2 as Record<string, unknown> | undefined;
    const imageVersions = imageVersionsRaw?.candidates as
      | Array<Record<string, unknown>>
      | undefined;

    const videoUrl = videoVersions?.[0]?.url as string | undefined;
    const imageUrl = imageVersions?.[0]?.url as string | undefined;
    const rawDisplayUrl = (media.display_url as string) || imageUrl || "";

    return NextResponse.json({
      success: true,
      media: {
        type: isVideo ? "video" : "image",
        shortcode,
        title,
        author,
        thumbnailUrl: rawDisplayUrl || videoUrl || "",
        videoUrl: isVideo ? videoUrl : undefined,
        width,
        height,
      },
    } satisfies InstagramDownloadResponse);
  } catch (error) {
    console.warn("GraphQL parse failed:", error);
    return null;
  }
}

// ─── Strategy 2: HTML scraping (desktop UA) ─────────────────────────

async function tryHtmlScraping(
  shortcode: string,
): Promise<NextResponse | null> {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  const html = await fetchInstagramHtml(postUrl, BROWSER_HEADERS);
  if (!html) return null;
  return parseHtmlMedia(html, shortcode);
}

// ─── Strategy 3: HTML scraping (mobile UA) ──────────────────────────

async function tryMobileScraping(
  shortcode: string,
): Promise<NextResponse | null> {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  const mobileHeaders: Record<string, string> = {
    ...BROWSER_HEADERS,
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
  };
  const html = await fetchInstagramHtml(postUrl, mobileHeaders);
  if (!html) return null;
  return parseHtmlMedia(html, shortcode);
}

// ─── HTML fetch & parse utilities ───────────────────────────────────

async function fetchInstagramHtml(
  url: string,
  headers: Record<string, string>,
): Promise<string> {
  try {
    const response = await fetchWithTimeout(url, {
      headers,
      redirect: "follow",
    });

    if (response.status === 429 || response.status === 503) {
      console.warn(`Instagram rate limited: ${response.status}`);
      return "";
    }

    if (!response.ok) {
      console.warn(`Instagram returned ${response.status}`);
      return "";
    }

    const html = await response.text();

    // Detect login page or too-small response
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : "";
    const isLoginPage =
      (pageTitle === "Login \u2022 Instagram" ||
        pageTitle === "Instagram") &&
      html.length < 100000; // Real post pages are typically 150k+ bytes

    if (isLoginPage) {
      console.warn(`Instagram returned login page (${html.length} bytes)`);
      return "";
    }

    return html;
  } catch {
    return "";
  }
}

/** Parse HTML using all available extraction strategies */
function parseHtmlMedia(
  html: string,
  shortcode: string,
): NextResponse | null {
  // Strategy A: JSON-LD structured data
  const jsonLd = extractJsonLd(html);
  if (jsonLd) {
    const result = parseJsonLdMedia(jsonLd, shortcode);
    if (result) return result;
  }

  // Strategy B: Embedded JS data (__INITIAL_STATE__, etc.)
  const embeddedResult = extractEmbeddedMedia(html, shortcode);
  if (embeddedResult) return embeddedResult;

  // Strategy C: Open Graph meta tags
  const ogResult = extractOgMedia(html, shortcode);
  if (ogResult) return ogResult;

  return null;
}

/** Extract JSON-LD structured data (`<script type="application/ld+json">`) */
function extractJsonLd(html: string): Record<string, unknown> | null {
  // Match <script type="application/ld+json">...</script>
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    try {
      const json = m[1].trim();
      // Instagram wraps JSON-LD in arrays sometimes
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0] as Record<string, unknown>;
      }
      return parsed as Record<string, unknown>;
    } catch {
      // Try unescaping first
      try {
        const parsed = JSON.parse(unescapeInstagram(m[1].trim()));
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0] as Record<string, unknown>;
        }
        return parsed as Record<string, unknown>;
      } catch {
        continue;
      }
    }
  }
  return null;
}

/** Parse JSON-LD for VideoObject or ImageObject media */
function parseJsonLdMedia(
  jsonLd: Record<string, unknown>,
  shortcode: string,
): NextResponse | null {
  const type = (jsonLd["@type"] as string) || "";

  if (type === "VideoObject" || type === "ImageObject") {
    const name = (jsonLd.name as string) || "";
    const description = (jsonLd.description as string) || "";
    const title = description || name || "Instagram Post";

    // Author: "NAME (@handle) on Instagram"
    let author = "Unknown";
    const authorMatch = name.match(/^(.+?)(?:\s*\(@\w+\))?\s+on\s+Instagram/i);
    if (authorMatch) author = authorMatch[1];

    // Thumbnail
    let thumbnailUrl = "";
    if (Array.isArray(jsonLd.thumbnailUrl)) {
      thumbnailUrl = (jsonLd.thumbnailUrl[0] as string) || "";
    } else if (typeof jsonLd.thumbnailUrl === "string") {
      thumbnailUrl = jsonLd.thumbnailUrl;
    }

    // Video URL
    const contentUrl = (jsonLd.contentUrl as string) || "";

    // Dimensions
    const width = jsonLd.width ? Number(jsonLd.width) : undefined;
    const height = jsonLd.height ? Number(jsonLd.height) : undefined;

    return NextResponse.json({
      success: true,
      media: {
        type: type === "VideoObject" ? "video" : "image",
        shortcode,
        title,
        author,
        thumbnailUrl: thumbnailUrl || contentUrl || "",
        videoUrl: type === "VideoObject" ? contentUrl : undefined,
        width: width || undefined,
        height: height || undefined,
      },
    } satisfies InstagramDownloadResponse);
  }

  return null;
}

/**
 * Strategy 2: Extract media from embedded JavaScript objects.
 * Instagram embeds video_url / display_url in various <script> tags.
 */
function extractEmbeddedMedia(
  html: string,
  shortcode: string,
): NextResponse | null {
  // Try to find "video_url" or "display_url" in JSON-like structures within scripts
  const videoUrlMatch = html.match(
    /"video_url"\s*:\s*"((?:https?:)?\\?\/\\?\/[^"]+)"/,
  );
  const displayUrlMatch = html.match(
    /"display_url"\s*:\s*"((?:https?:)?\\?\/\\?\/[^"]+)"/,
  );
  const dimensionsMatch = html.match(
    /"dimensions"\s*:\s*\{[^}]*"height"\s*:\s*(\d+)[^}]*"width"\s*:\s*(\d+)/,
  );

  if (!videoUrlMatch && !displayUrlMatch) return null;

  const rawVideoUrl = videoUrlMatch ? videoUrlMatch[1] : "";
  const rawDisplayUrl = displayUrlMatch ? displayUrlMatch[1] : "";
  const videoUrl = unescapeInstagram(rawVideoUrl).replace(/^\/\//, "https://");
  const displayUrl = unescapeInstagram(rawDisplayUrl).replace(
    /^\/\//,
    "https://",
  );

  if (!videoUrl && !displayUrl) return null;

  // Try to find author from the HTML
  const authorMatch = html.match(
    /"username"\s*:\s*"([^"]+)"|"full_name"\s*:\s*"([^"]+)"/,
  );
  const author = authorMatch
    ? authorMatch[2] || authorMatch[1] || "Unknown"
    : "Unknown";

  const width = dimensionsMatch ? parseInt(dimensionsMatch[2], 10) : undefined;
  const height = dimensionsMatch ? parseInt(dimensionsMatch[1], 10) : undefined;

  return NextResponse.json({
    success: true,
    media: {
      type: videoUrl ? "video" : "image",
      shortcode,
      title: author ? `${author} on Instagram` : "Instagram Post",
      author,
      thumbnailUrl: displayUrl || videoUrl,
      videoUrl: videoUrl || undefined,
      width,
      height,
    },
  } satisfies InstagramDownloadResponse);
}

/** Strategy 3: Open Graph meta tags (last resort) */
function extractOgMedia(
  html: string,
  shortcode: string,
): NextResponse | null {
  const ogTitle = extractMeta(html, "og:title");
  const ogDescription = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");
  const ogVideo = extractMeta(html, "og:video");
  const ogVideoWidth = extractMeta(html, "og:video:width");
  const ogVideoHeight = extractMeta(html, "og:video:height");

  if (!ogImage && !ogVideo) return null;

  let author = "Unknown";
  if (ogTitle) {
    const m = ogTitle.match(/^(.+?)\s+on\s+Instagram/i);
    if (m) author = m[1];
  }

  let title = ogDescription || ogTitle || "Instagram Post";
  const descAuthorMatch = title.match(/^.+? on Instagram:?\s*/i);
  if (descAuthorMatch) title = title.slice(descAuthorMatch[0].length) || title;
  title = title.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (!title || title.length < 3) title = ogTitle || "Instagram Post";

  return NextResponse.json({
    success: true,
    media: {
      type: ogVideo ? "video" : "image",
      shortcode,
      title,
      author,
      thumbnailUrl: ogImage || "",
      videoUrl: ogVideo || undefined,
      width: ogVideoWidth ? parseInt(ogVideoWidth, 10) : undefined,
      height: ogVideoHeight ? parseInt(ogVideoHeight, 10) : undefined,
    },
  } satisfies InstagramDownloadResponse);
}

