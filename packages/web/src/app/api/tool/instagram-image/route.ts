// API Route: Instagram Image Proxy
// Proxies Instagram CDN images to bypass hotlink protection (403 Referer check).
// Instagram blocks images when Referer != instagram.com.
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
// Cache proxied images for 1 hour on CDN
export const dynamic = "force-dynamic";

/** Instagram CDN & media domains (server-side fetch doesn't send Referer) */
const ALLOWED_HOSTS = [
  "scontent.cdninstagram.com",
  "instagram.com",
  "www.instagram.com",
  "cdninstagram.com",
  "fbcdn.net",
];

const ALLOWED_HOST_SUFFIXES = [
  ".cdninstagram.com",
  ".fbcdn.net",
];

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (ALLOWED_HOSTS.includes(host)) return true;
    return ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "url parameter required" }, { status: 400 });
    }

    if (!isAllowed(url)) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    // Fetch without Referer header — Instagram CDN serves images normally
    const upstream = await fetch(url, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";
    const cacheControl =
      upstream.headers.get("cache-control") || "public, max-age=3600, s-maxage=86400";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  } catch (error) {
    console.error("Instagram image proxy error:", error);
    return NextResponse.json(
      { error: "Proxy request failed" },
      { status: 500 },
    );
  }
}
