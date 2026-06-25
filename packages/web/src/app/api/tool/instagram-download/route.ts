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
  const url = raw.trim();
  if (!url) return null;

  // Handle standalone shortcode (typically 11 chars, but be flexible)
  const standalone = url.match(/^([a-zA-Z0-9_-]{8,20})$/);
  if (standalone && !url.includes("/") && !url.includes(".")) {
    return standalone[1];
  }

  // Decode only AFTER standalone check to avoid corrupting pure shortcodes
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    decoded = url;
  }

  // Strip protocol and query/fragment for cleaner matching
  const cleaned = decoded.replace(/^https?:\/\//i, "").replace(/[?#].*$/, "");

  // Instagram hostnames (including subdomain variants and short URLs)
  const hostRE = /(?:www\.|m\.|l\.|web\.)?instagram\.com|instagr\.am|ig\.me/i;

  // Strategy 1: Standard paths — /p/, /reel/, /reels/, /tv/, /stories/
  // Uses variable-length shortcode matching (Instagram shortcodes are typically 8-20 chars)
  let m = cleaned.match(
    new RegExp(
      `(?:${hostRE.source})\\/(?:p|reels?|tv|stories(?:\\/[^\\/]+)?)\\/([a-zA-Z0-9_-]{8,20})`,
      "i",
    ),
  );
  if (m) return m[1];

  // Strategy 2: /share/ paths — /share/p/SHORTCODE, /share/reel/SHORTCODE, /share/SHORTCODE
  m = cleaned.match(
    new RegExp(
      `(?:${hostRE.source})\\/share\\/(?:(?:p|reels?)\\/)?([a-zA-Z0-9_-]{8,20})`,
      "i",
    ),
  );
  if (m) return m[1];

  // Strategy 3: Fallback — any shortcode-looking slug after Instagram domain
  m = cleaned.match(
    new RegExp(
      `(?:${hostRE.source})\\/(?:[a-z0-9_.]+\\/)*([a-zA-Z0-9_-]{8,20})(?:\\/|$)`,
      "i",
    ),
  );
  if (m) return m[1];

  // Strategy 4: Handle ddinstagram / embed proxy URLs
  // e.g., ddinstagram.com/p/SHORTCODE, d.ddinstagram.com/p/SHORTCODE
  m = cleaned.match(
    /(?:ddinstagram\.com|d\.ddinstagram\.com)\/(?:p|reels?)\/([a-zA-Z0-9_-]{8,20})/i,
  );
  if (m) return m[1];

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
    "(KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua":
    '"Google Chrome";v="133", "Chromium";v="133", "Not_A Brand";v="24"',
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

// ─── Strategy 4: Meta oEmbed API (Tokenless) ────────────────────────

/**
 * Use Meta's tokenless oEmbed API (announced June 15, 2026).
 * No auth required — works reliably from datacenter/Vercel IPs.
 * Returns thumbnail URL, author info, and embed HTML.
 */
async function tryOembed(
  postUrl: string,
): Promise<NextResponse | null> {
  try {
    const oembedUrl = new URL("https://graph.facebook.com/v25.0/instagram_oembed");
    oembedUrl.searchParams.set("url", postUrl);

    const response = await fetchWithTimeout(oembedUrl.toString(), {
      headers: {
        "User-Agent": BROWSER_HEADERS["User-Agent"],
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`oEmbed returned ${response.status}`);
      return null;
    }

    const json = await response.json() as Record<string, unknown>;

    // oEmbed returns: html, thumbnail_url, author_name, title, provider_name, type, version
    const thumbnailUrl = (json.thumbnail_url as string) || "";
    const author = (json.author_name as string) || "Unknown";
    const title = (json.title as string) || "Instagram Post";
    const type = (json.type as string) || ""; // "rich" or "video"
    const html = (json.html as string) || "";

    if (!thumbnailUrl && !html) {
      console.warn("oEmbed returned no usable data");
      return null;
    }

    // Try to extract media URL from the HTML embed code
    let videoUrl: string | undefined;
    if (html) {
      // Look for video URL in the embed HTML
      const videoMatch = html.match(/video_url["']?\s*[:=]\s*["']([^"']+)["']/i);
      if (videoMatch) videoUrl = videoMatch[1];
      // Try to extract image URL from embed HTML's og:image or similar
      if (!thumbnailUrl) {
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) videoUrl = imgMatch[1]; // Overloaded — this is actually image
      }
    }

    return NextResponse.json({
      success: true,
      media: {
        type: type === "video" || videoUrl ? "video" : "image",
        shortcode: postUrl.split("/").filter(Boolean).pop() || "",
        title,
        author,
        thumbnailUrl: thumbnailUrl || videoUrl || "",
        videoUrl: type === "video" ? videoUrl : undefined,
      },
    } satisfies InstagramDownloadResponse);
  } catch (error) {
    console.warn("oEmbed fetch failed:", error);
    return null;
  }
}

// ─── Strategy 5: ddinstagram Proxy ──────────────────────────────────

/**
 * Try fetching media via ddinstagram.com embed proxy.
 * ddinstagram rewrites Instagram URLs to serve direct media embeds.
 * e.g., ddinstagram.com/p/SHORTCODE → returns HTML page with direct media URLs
 */
async function tryDdinstagramProxy(
  shortcode: string,
): Promise<NextResponse | null> {
  try {
    const proxyUrl = `https://ddinstagram.com/p/${shortcode}/`;
    const response = await fetchWithTimeout(proxyUrl, {
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) {
      console.warn(`ddinstagram proxy returned ${response.status}`);
      return null;
    }

    const html = await response.text();

    // ddinstagram serves a simple HTML page with og: meta tags for embeds
    const ogImage = extractMeta(html, "og:image");
    const ogVideo = extractMeta(html, "og:video");
    const ogTitle = extractMeta(html, "og:title");
    const ogDescription = extractMeta(html, "og:description");

    if (!ogImage && !ogVideo) {
      // Try finding media URLs directly in the HTML
      const videoMatch = html.match(/property=["']og:video["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/property=["']og:video:secure_url["'][^>]+content=["']([^"']+)["']/i);
      const imgMatch = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

      if (!imgMatch && !videoMatch) return null;

      const thumbnailUrl = (imgMatch?.[1] || videoMatch?.[1] || "");
      const videoUrl = videoMatch?.[1];
      let author = "Unknown";
      if (ogTitle) {
        const m = ogTitle.match(/^(.+?)\s+on\s+Instagram/i);
        if (m) author = m[1];
      }

      return NextResponse.json({
        success: true,
        media: {
          type: videoUrl ? "video" : "image",
          shortcode,
          title: ogDescription || ogTitle || "Instagram Post",
          author,
          thumbnailUrl,
          videoUrl,
        },
      } satisfies InstagramDownloadResponse);
    }

    let author = "Unknown";
    if (ogTitle) {
      const m = ogTitle.match(/^(.+?)\s+on\s+Instagram/i);
      if (m) author = m[1];
    }

    return NextResponse.json({
      success: true,
      media: {
        type: ogVideo ? "video" : "image",
        shortcode,
        title: ogDescription || ogTitle || "Instagram Post",
        author,
        thumbnailUrl: ogImage || ogVideo || "",
        videoUrl: ogVideo || undefined,
      },
    } satisfies InstagramDownloadResponse);
  } catch (error) {
    console.warn("ddinstagram proxy failed:", error);
    return null;
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
    const postUrl = `https://www.instagram.com/p/${shortcode}/`;

    // Strategy 1: Instagram GraphQL API (returns structured JSON w/ media URLs)
    const graphqlResult = await tryGraphQL(shortcode);
    if (graphqlResult) return graphqlResult;

    // Strategy 2: HTML scraping with desktop UA
    const htmlResult = await tryHtmlScraping(shortcode);
    if (htmlResult) return htmlResult;

    // Strategy 3: HTML scraping with mobile UA (different page structure)
    const mobileResult = await tryMobileScraping(shortcode);
    if (mobileResult) return mobileResult;

    // Strategy 4: Meta oEmbed API (tokenless — new as of June 15, 2026)
    // Returns embed HTML + thumbnail, works from datacenter IPs
    const oembedResult = await tryOembed(postUrl);
    if (oembedResult) return oembedResult;

    // Strategy 5: ddinstagram embed proxy (last resort)
    // Rewrites instagram.com → ddinstagram.com to bypass blocks
    const proxyResult = await tryDdinstagramProxy(shortcode);
    if (proxyResult) return proxyResult;

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

/** doc_id values — Instagram rotates these every 2-4 weeks. Multiple attempts. */
const GRAPHQL_DOC_IDS = [
  "8845758582119845",  // ScrapFly June 2026
  "10015901848480474", // Instagram Media Scraper (api/graphql GET)
  "9310670392322965",  // Profile posts doc_id (fallback)
];

/** LSD token for X-FB-LSD header (rotates less frequently than doc_id) */
const IG_LSD_TOKEN = "AVqbxe3J_YA";

/**
 * Try Instagram's internal GraphQL API.
 * Returns structured JSON with post metadata and media URLs.
 */
async function tryGraphQL(
  shortcode: string,
): Promise<NextResponse | null> {
  // Attempt 1: POST to /api/graphql (most common working approach)
  for (const docId of GRAPHQL_DOC_IDS) {
    try {
      const variables = JSON.stringify({
        shortcode,
        fetch_comment_count: 0,
        child_comment_count: 0,
        parent_comment_count: 0,
        fetch_tagged_user_count: null,
        hoisted_comment_id: null,
        hoisted_reply_id: null,
      });

      const formBody = new URLSearchParams({
        variables,
        doc_id: docId,
      });

      const response = await fetchWithTimeout(
        "https://www.instagram.com/api/graphql",
        {
          method: "POST",
          headers: {
            ...BROWSER_HEADERS,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-IG-App-ID": IG_APP_ID,
            "X-ASBD-ID": "129477",
            "X-FB-LSD": IG_LSD_TOKEN,
            "X-IG-WWW-Claim": "0",
            "X-Requested-With": "XMLHttpRequest",
            Origin: "https://www.instagram.com",
            Referer: `https://www.instagram.com/p/${shortcode}/`,
            "Sec-Fetch-Site": "same-origin",
          },
          body: formBody.toString(),
        },
      );

      if (!response.ok) {
        console.warn(`GraphQL POST /api/graphql returned ${response.status} (doc_id=${docId})`);
        continue;
      }

      const json = await response.json();
      const result = parseGraphQLResponse(json, shortcode);
      if (result) return result;
    } catch (error) {
      console.warn(`GraphQL POST /api/graphql failed (doc_id=${docId}):`, error);
    }
  }

  // Attempt 2: GET to /api/graphql (alternative approach with query params)
  for (const docId of GRAPHQL_DOC_IDS) {
    try {
      const graphqlUrl = new URL("https://www.instagram.com/api/graphql");
      graphqlUrl.searchParams.set(
        "variables",
        JSON.stringify({ shortcode }),
      );
      graphqlUrl.searchParams.set("doc_id", docId);
      graphqlUrl.searchParams.set("lsd", IG_LSD_TOKEN);

      const response = await fetchWithTimeout(graphqlUrl.toString(), {
        method: "GET",
        headers: {
          ...BROWSER_HEADERS,
          "X-IG-App-ID": IG_APP_ID,
          "X-FB-LSD": IG_LSD_TOKEN,
          "X-ASBD-ID": "129477",
          "X-Requested-With": "XMLHttpRequest",
          Origin: "https://www.instagram.com",
          Referer: `https://www.instagram.com/p/${shortcode}/`,
          "Sec-Fetch-Site": "same-origin",
        },
      });

      if (!response.ok) {
        console.warn(`GraphQL GET /api/graphql returned ${response.status} (doc_id=${docId})`);
        continue;
      }

      const json = await response.json();
      const result = parseGraphQLResponse(json, shortcode);
      if (result) return result;
    } catch (error) {
      console.warn(`GraphQL GET /api/graphql failed (doc_id=${docId}):`, error);
    }
  }

  // Attempt 3: POST to /graphql/query (older endpoint, still works for some)
  for (const docId of GRAPHQL_DOC_IDS) {
    try {
      const variables = JSON.stringify({
        shortcode,
        fetch_comment_count: 0,
        child_comment_count: 0,
        parent_comment_count: 0,
        fetch_tagged_user_count: null,
        hoisted_comment_id: null,
        hoisted_reply_id: null,
      });

      const body = `variables=${encodeURIComponent(variables)}&doc_id=${docId}`;

      const response = await fetchWithTimeout(
        "https://www.instagram.com/graphql/query",
        {
          method: "POST",
          headers: {
            ...BROWSER_HEADERS,
            "Content-Type": "application/x-www-form-urlencoded",
            "X-IG-App-ID": IG_APP_ID,
            "X-FB-LSD": IG_LSD_TOKEN,
            "X-ASBD-ID": "129477",
            "X-Requested-With": "XMLHttpRequest",
            Origin: "https://www.instagram.com",
            Referer: `https://www.instagram.com/p/${shortcode}/`,
            "Sec-Fetch-Site": "same-origin",
          },
          body,
        },
      );

      if (!response.ok) {
        console.warn(`GraphQL POST /graphql/query returned ${response.status} (doc_id=${docId})`);
        continue;
      }

      const json = await response.json();
      const result = parseGraphQLResponse(json, shortcode);
      if (result) return result;
    } catch (error) {
      console.warn(`GraphQL POST /graphql/query failed (doc_id=${docId}):`, error);
    }
  }

  return null;
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

    // Detect login page, rate limit, or too-small response
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : "";

    // Real Instagram post pages are typically 150k+ bytes
    const isTooSmall = html.length < 80000;
    const isLoginPage =
      pageTitle === "Login \u2022 Instagram" ||
      pageTitle === "Instagram" ||
      html.includes('"native_client_side_nav_react"') === false;

    if (isLoginPage || isTooSmall) {
      console.warn(
        `Instagram returned login/block page (${html.length} bytes, title="${pageTitle}")`,
      );
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
 * Extract media from embedded JavaScript objects.
 * Instagram embeds video_url / display_url in various <script> tags,
 * and full GraphQL responses in __INITIAL_STATE__ or similar globals.
 */
function extractEmbeddedMedia(
  html: string,
  shortcode: string,
): NextResponse | null {
  // Strategy A: Try extracting full GraphQL response embedded in the page
  // Instagram pages embed a full xdt_shortcode_media JSON blob
  const graphqlEmbedMatch = html.match(
    /"xdt_shortcode_media"\s*:\s*(\{[\s\S]*?"shortcode"\s*:\s*"[^"]+")/,
  );
  if (graphqlEmbedMatch) {
    try {
      // Try to extract the full object by finding its boundaries
      const startIdx = html.indexOf('"xdt_shortcode_media"');
      if (startIdx > 0) {
        // Find the matching closing brace
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let endIdx = html.indexOf("{", startIdx);
        if (endIdx > 0) {
          for (let i = endIdx; i < html.length; i++) {
            const ch = html[i];
            if (escapeNext) { escapeNext = false; continue; }
            if (ch === "\\") { escapeNext = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (inString) continue;
            if (ch === "{") braceCount++;
            if (ch === "}") {
              braceCount--;
              if (braceCount === 0) {
                const jsonStr = html.substring(endIdx, i + 1);
                const parsed = JSON.parse(unescapeInstagram(jsonStr));
                return parseGraphQLMediaObject(parsed, shortcode);
              }
            }
          }
        }
      }
    } catch {
      // Fall through to simpler extraction
    }
  }

  // Strategy B: Extract individual fields from embedded JSON
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

  // Try to find caption
  const captionMatch = html.match(
    /"text"\s*:\s*"([^"]{1,500})"/,
  );
  const title = captionMatch
    ? captionMatch[1]
    : author
      ? `${author} on Instagram`
      : "Instagram Post";

  const width = dimensionsMatch ? parseInt(dimensionsMatch[2], 10) : undefined;
  const height = dimensionsMatch ? parseInt(dimensionsMatch[1], 10) : undefined;

  return NextResponse.json({
    success: true,
    media: {
      type: videoUrl ? "video" : "image",
      shortcode,
      title,
      author,
      thumbnailUrl: displayUrl || videoUrl,
      videoUrl: videoUrl || undefined,
      width,
      height,
    },
  } satisfies InstagramDownloadResponse);
}

/**
 * Parse a directly extracted GraphQL media object (from embedded page data).
 * Handles the xdt_shortcode_media structure.
 */
function parseGraphQLMediaObject(
  media: Record<string, unknown>,
  shortcode: string,
): NextResponse | null {
  try {
    const isVideo = media.is_video === true || media.__typename === "GraphVideo";
    const owner = media.owner as Record<string, unknown> | undefined;
    const author = (owner?.username as string) ||
      (owner?.full_name as string) || "Unknown";
    const caption = media.caption as Record<string, unknown> | undefined;
    const displayUrl = (media.display_url as string) || "";
    const videoUrl = (media.video_url as string) || "";

    // Dimensions
    const dimensions = media.dimensions as Record<string, number> | undefined;
    const width = dimensions?.width || (media.original_width as number);
    const height = dimensions?.height || (media.original_height as number);

    // Get high-res image
    const displayResources = media.display_resources as
      | Array<Record<string, unknown>>
      | undefined;
    const bestImage = displayResources?.[displayResources.length - 1]?.src as string;
    const thumbnailUrl = bestImage || displayUrl || videoUrl || "";

    return NextResponse.json({
      success: true,
      media: {
        type: isVideo ? "video" : "image",
        shortcode,
        title: (caption?.text as string) || `${author} on Instagram`,
        author,
        thumbnailUrl,
        videoUrl: isVideo ? videoUrl : undefined,
        width,
        height,
      },
    } satisfies InstagramDownloadResponse);
  } catch {
    return null;
  }
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

