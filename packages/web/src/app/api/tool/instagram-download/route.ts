import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface InstagramDownloadResponse {
  success: boolean;
  error?: string;
  media?: {
    type: "video" | "image";
    shortcode: string;
    title: string;
    author: string;
    thumbnailUrl: string;
    /** Direct CDN video URL (only for video posts) */
    videoUrl?: string;
    width?: number;
    height?: number;
  };
}

/** Extracts Instagram post shortcode from URL formats */
function extractShortcode(url: string): string | null {
  const trimmed = url.trim().replace(/\/$/, "");
  const match = trimmed.match(
    /(?:instagram\.com|instagr\.am)\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/,
  );
  return match ? match[1] : null;
}

/**
 * Extracts the first capturing group from a regex match on the given text.
 */
function regexExtract(pattern: RegExp, text: string): string {
  const m = text.match(pattern);
  return m ? m[1] : "";
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

  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  try {
    const html = await fetchInstagramHtml(postUrl);

    if (!html) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Instagram returned an empty response. The post may be private or Instagram is rate-limiting.",
        },
        { status: 200 },
      );
    }

    // Strategy 1: Parse JSON-LD structured data (most reliable)
    const jsonLd = extractJsonLd(html);
    if (jsonLd) {
      const result = parseJsonLdMedia(jsonLd, shortcode);
      if (result) return result;
    }

    // Strategy 2: Extract from embedded window.__INITIAL_STATE__ or similar JS objects
    const embeddedJson = extractEmbeddedMedia(html, shortcode);
    if (embeddedJson) return embeddedJson;

    // Strategy 3: Fall back to Open Graph meta tags
    const ogResult = extractOgMedia(html, shortcode);
    if (ogResult) return ogResult;

    return NextResponse.json(
      {
        success: false,
        error:
          "Could not extract media from this post. It may be private, deleted, or Instagram changed their page format.",
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

/** Fetch Instagram HTML with proper browser headers */
async function fetchInstagramHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
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

  // Detect real login page: title is literally "Login • Instagram" and
  // the page is very small (no post content).
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "";
  const isLoginPage =
    (pageTitle === "Login • Instagram" || pageTitle === "Instagram") &&
    html.length < 80000; // Real post pages are 150k+ bytes

  if (isLoginPage) {
    console.warn("Instagram returned login page");
    return "";
  }

  return html;
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

