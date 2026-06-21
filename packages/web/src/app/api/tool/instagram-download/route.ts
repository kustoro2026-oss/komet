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

/**
 * Extracts Instagram post shortcode from various URL formats.
 * Examples:
 *   - https://www.instagram.com/p/ABC123xyz/
 *   - https://www.instagram.com/reel/ABC123xyz/
 *   - https://www.instagram.com/reels/ABC123xyz/
 *   - https://instagr.am/p/ABC123xyz/
 */
function extractShortcode(url: string): string | null {
  const trimmed = url.trim().replace(/\/$/, "");
  const match = trimmed.match(
    /(?:instagram\.com|instagr\.am)\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/,
  );
  return match ? match[1] : null;
}

/**
 * Fetches Instagram post page HTML and extracts Open Graph metadata
 * to get CDN video/image URLs. Instagram serves these publicly for
 * non-private posts.
 */
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
        error: "Invalid Instagram URL. Paste a link like instagram.com/p/... or instagram.com/reel/...",
      },
      { status: 400 },
    );
  }

  // Build a clean Instagram post URL (always use /p/ — works for reels too)
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  try {
    const response = await fetch(postUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
      redirect: "follow",
    });

    if (response.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: "Instagram is rate limiting. Please wait a moment and try again.",
        },
        { status: 200 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Instagram returned status ${response.status}. The post may be private or deleted.`,
        },
        { status: 200 },
      );
    }

    const html = await response.text();

    // Check if the page is a login/private page (Instagram redirects to login for private posts)
    if (
      html.includes('"login-modal"') ||
      html.includes('accounts/login') ||
      html.includes("Login • Instagram") ||
      !html.includes("og:title")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This post may be from a private account or requires login. Only public posts can be downloaded.",
        },
        { status: 200 },
      );
    }

    // Extract Open Graph metadata
    const ogTitle = extractMeta(html, "og:title");
    const ogDescription = extractMeta(html, "og:description");
    const ogImage = extractMeta(html, "og:image");
    const ogVideo = extractMeta(html, "og:video");
    const ogVideoWidth = extractMeta(html, "og:video:width");
    const ogVideoHeight = extractMeta(html, "og:video:height");

    // Parse author from title (format: "Author Name on Instagram: ...")
    let author = "Unknown";
    if (ogTitle) {
      const authorMatch = ogTitle.match(/^(.+?)\s+on\s+Instagram/i);
      if (authorMatch) author = authorMatch[1];
    }

    // Parse description as title (strip author prefix)
    let title = ogDescription || ogTitle || "Instagram Post";
    const descAuthorMatch = title.match(/^.+? on Instagram:?\s*/i);
    if (descAuthorMatch) {
      title = title.slice(descAuthorMatch[0].length) || title;
    }
    // Clean up newlines and excessive spaces
    title = title.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
    if (!title || title.length < 3) title = ogTitle || "Instagram Post";

    // Determine media type
    if (ogVideo) {
      return NextResponse.json({
        success: true,
        media: {
          type: "video",
          shortcode,
          title,
          author,
          thumbnailUrl: ogImage || "",
          videoUrl: ogVideo,
          width: ogVideoWidth ? parseInt(ogVideoWidth, 10) : undefined,
          height: ogVideoHeight ? parseInt(ogVideoHeight, 10) : undefined,
        },
      } satisfies InstagramDownloadResponse);
    }

    if (ogImage) {
      return NextResponse.json({
        success: true,
        media: {
          type: "image",
          shortcode,
          title,
          author,
          thumbnailUrl: ogImage,
          width: ogVideoWidth ? parseInt(ogVideoWidth, 10) : undefined,
          height: ogVideoHeight ? parseInt(ogVideoHeight, 10) : undefined,
        },
      } satisfies InstagramDownloadResponse);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Could not find any media on this post. The post may be empty or deleted.",
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

/** Extract content from an HTML meta tag */
function extractMeta(html: string, property: string): string {
  // Try og: (property="og:xxx")
  const re1 = new RegExp(
    `<meta[^>]+property=["']${property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const m1 = html.match(re1);
  if (m1) return m1[1];

  // Try name="xxx"
  const re2 = new RegExp(
    `<meta[^>]+name=["']${property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const m2 = html.match(re2);
  if (m2) return m2[1];

  return "";
}
