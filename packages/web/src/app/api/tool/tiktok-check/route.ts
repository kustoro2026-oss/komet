import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface TikTokCheckResponse {
  username: string;
  available: boolean;
  error?: string;
}

/**
 * Checks if a TikTok username is available by fetching the TikTok profile page.
 * TikTok returns different status codes / redirects based on whether the profile exists.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username parameter is required" },
      { status: 400 }
    );
  }

  // Clean the username: remove @ prefix, trim whitespace
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();

  // Validate username format (TikTok rules: letters, numbers, underscore, period, 2-24 chars)
  if (!/^[a-z0-9._]{2,24}$/.test(cleanUsername)) {
    return NextResponse.json(
      {
        username: cleanUsername,
        available: false,
        error: "Invalid username format. TikTok usernames can only contain letters, numbers, underscores, and periods (2-24 characters).",
      } satisfies TikTokCheckResponse,
      { status: 200 }
    );
  }

  try {
    const response = await fetch(
      `https://www.tiktok.com/@${cleanUsername}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "manual",
      }
    );

    // TikTok returns:
    // - 200 if the profile exists
    // - 404 if the profile does not exist
    // - Sometimes redirects (301/302) if the username changed
    
    if (response.status === 200) {
      return NextResponse.json({
        username: cleanUsername,
        available: false,
      } satisfies TikTokCheckResponse);
    }

    if (response.status === 404) {
      return NextResponse.json({
        username: cleanUsername,
        available: true,
      } satisfies TikTokCheckResponse);
    }

    // Handle redirects (profile exists but was renamed/moved)
    if (response.status === 301 || response.status === 302) {
      return NextResponse.json({
        username: cleanUsername,
        available: false,
      } satisfies TikTokCheckResponse);
    }

    // Rate limited or blocked
    if (response.status === 429) {
      return NextResponse.json(
        {
          username: cleanUsername,
          available: false,
          error: "Too many requests. Please try again in a moment.",
        } satisfies TikTokCheckResponse,
        { status: 200 }
      );
    }

    // Other unexpected status
    return NextResponse.json(
      {
        username: cleanUsername,
        available: false,
        error: `Unable to verify username (status ${response.status}). Please try again.`,
      } satisfies TikTokCheckResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("TikTok check error:", error);
    return NextResponse.json(
      {
        username: cleanUsername,
        available: false,
        error: "Network error. Please check your connection and try again.",
      } satisfies TikTokCheckResponse,
      { status: 200 }
    );
  }
}
