import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface TikTokSuggestion {
  username: string;
  displayName: string;
  verified: boolean;
}

/**
 * Fetches similar TikTok usernames by scraping the TikTok search results page.
 * Parses the __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON to extract user suggestions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 1) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  const cleanQuery = query.trim().toLowerCase();

  try {
    const response = await fetch(
      `https://www.tiktok.com/search?q=${encodeURIComponent(cleanQuery)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const html = await response.text();

    // Try to extract the hydration JSON that contains search results
    const jsonMatch = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/
    );

    const suggestions: TikTokSuggestion[] = [];
    const seenUsernames = new Set<string>();

    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]);

        // Navigate to find user cards in search results
        const userModules =
          data?.__DEFAULT_SCOPE__?.["webapp.search-video"]?.userList ||
          data?.__DEFAULT_SCOPE__?.["webapp.search-video"]?.itemList ||
          [];

        // Also check alternative paths
        const altModules =
          data?.__DEFAULT_SCOPE__?.["webapp.search-video"]?.userCardList ||
          [];

        const allModules = [...userModules, ...altModules];

        for (const mod of allModules) {
          if (!mod) continue;

          // Extract user info from the module
          const userInfo = mod.userInfo || mod.user || mod;
          const uniqueId = userInfo?.uniqueId || userInfo?.unique_id || "";

          if (uniqueId && !seenUsernames.has(uniqueId)) {
            seenUsernames.add(uniqueId);
            suggestions.push({
              username: uniqueId,
              displayName: userInfo?.nickname || userInfo?.displayName || uniqueId,
              verified: userInfo?.verified || false,
            });
          }
        }
      } catch {
        // JSON parse failed — try regex fallback below
      }
    }

    // Fallback: extract uniqueId patterns directly from HTML
    if (suggestions.length === 0) {
      const uniqueIdRegex = /"uniqueId"\s*:\s*"([^"]+)"/g;
      let match: RegExpExecArray | null;
      while ((match = uniqueIdRegex.exec(html)) !== null) {
        const uid = match[1];
        if (uid && uid.length >= 2 && !seenUsernames.has(uid)) {
          seenUsernames.add(uid);
          suggestions.push({
            username: uid,
            displayName: uid,
            verified: false,
          });
        }
        if (suggestions.length >= 10) break;
      }
    }

    // Limit to 10 suggestions
    return NextResponse.json({
      suggestions: suggestions.slice(0, 10),
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
