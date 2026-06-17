import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface TikTokCheckResponse {
  username: string;
  available: boolean;
  error?: string;
}

/**
 * Checks if a TikTok username is available by fetching the TikTok profile page
 * and inspecting the HTML response body.
 *
 * TikTok always returns HTTP 200 even for non-existent accounts, showing a
 * "Couldn't find this account" page. We detect the difference by:
 *   - Looking for "Couldn't find this account" in the title/body → available
 *   - Looking for user profile data (__UNIVERSAL_DATA_FOR_REHYDRATION__) → taken
 *   - Redirect (301/302) → taken (account renamed/moved)
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
        error:
          "Invalid username format. TikTok usernames can only contain letters, numbers, underscores, and periods (2-24 characters).",
      } as TikTokCheckResponse,
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
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "manual",
      }
    );

    // Handle redirects — account exists but was renamed/moved
    if (response.status === 301 || response.status === 302) {
      return NextResponse.json({
        username: cleanUsername,
        available: false,
      } satisfies TikTokCheckResponse);
    }

    // Rate limited or blocked by TikTok
    if (response.status === 429) {
      return NextResponse.json(
        {
          username: cleanUsername,
          available: false,
          error: "Too many requests. Please try again in a moment.",
        } as TikTokCheckResponse,
        { status: 200 }
      );
    }

    // Non-200 response (shouldn't normally happen, but treat as unavailable)
    if (response.status !== 200) {
      return NextResponse.json(
        {
          username: cleanUsername,
          available: false,
          error: `Unable to verify (HTTP ${response.status}). Please try again.`,
        } as TikTokCheckResponse,
        { status: 200 }
      );
    }

    // Read the HTML body to determine if the account exists
    const html = await response.text();

    // Check for "not found" indicators in the HTML
    const isNotFound =
      html.includes("Couldn&#x27;t find this account") ||
      html.includes("Couldn't find this account") ||
      html.includes("tiktok-verify-page");

    if (isNotFound) {
      return NextResponse.json({
        username: cleanUsername,
        available: true,
      } satisfies TikTokCheckResponse);
    }

    // Check for profile existence indicators
    // TikTok embeds user data in a JSON blob for hydration
    const hasUserData =
      html.includes('"webapp.user-detail"') ||
      html.includes('"userInfo"') ||
      html.includes('"uniqueId":"' + cleanUsername + '"');

    if (hasUserData) {
      return NextResponse.json({
        username: cleanUsername,
        available: false,
      } satisfies TikTokCheckResponse);
    }

    // Fallback: check the page title
    // Real profile: "<Display Name> (@username) | TikTok"
    // Not found:   "TikTok - Make Your Day" or generic title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    const pageTitle = titleMatch ? titleMatch[1] : "";

    if (
      pageTitle.toLowerCase().includes("couldn't find") ||
      pageTitle === "TikTok - Make Your Day" ||
      pageTitle === "TikTok"
    ) {
      return NextResponse.json({
        username: cleanUsername,
        available: true,
      } satisfies TikTokCheckResponse);
    }

    // If the title contains the username, it's very likely a real profile
    if (pageTitle.toLowerCase().includes(cleanUsername)) {
      return NextResponse.json({
        username: cleanUsername,
        available: false,
      } satisfies TikTokCheckResponse);
    }

    // Completely uncertain — return error
    return NextResponse.json(
      {
        username: cleanUsername,
        available: false,
        error:
          "Could not reliably determine if this username exists. TikTok may have changed their page structure.",
      } as TikTokCheckResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("TikTok check error:", error);
    return NextResponse.json(
      {
        username: cleanUsername,
        available: false,
        error: "Network error. Please check your connection and try again.",
      } as TikTokCheckResponse,
      { status: 200 }
    );
  }
}
