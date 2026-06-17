import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface TikTokSuggestion {
  username: string;
  displayName: string;
  verified: boolean;
}

/**
 * Extracts text between two strings — safer than regex for giant JSON payloads.
 */
function extractBetween(html: string, startMarker: string, endMarker: string): string | null {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;
  const contentStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, contentStart);
  if (endIdx === -1) return null;
  return html.slice(contentStart, endIdx);
}

/**
 * Fetches similar TikTok usernames by scraping the TikTok search results page.
 * Uses multiple extraction strategies for reliability.
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
    const suggestions: TikTokSuggestion[] = [];
    const seenUsernames = new Set<string>();

    // ── Strategy 1: Extract hydration JSON using indexOf (handles < in JSON) ──
    const jsonStr = extractBetween(
      html,
      '<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"',
      "</script>"
    );

    if (jsonStr) {
      // Find the actual JSON start (after the > of the script tag)
      const jsonStart = jsonStr.indexOf(">");
      const rawJson = jsonStart !== -1 ? jsonStr.slice(jsonStart + 1) : jsonStr;

      try {
        const data = JSON.parse(rawJson);

        // Navigate TikTok's data structure to find users
        const defaultScope = data?.__DEFAULT_SCOPE__ || {};

        // Try multiple known paths for search results
        const searchPaths = [
          "webapp.search-video",
          "webapp.search-general",
          "webapp.search-top",
        ];

        for (const path of searchPaths) {
          const searchData = defaultScope[path];
          if (!searchData) continue;

          // Try different user list locations
          const userLists = [
            searchData.userList,
            searchData.userCardList,
            searchData.itemList,
            searchData.user_list,
          ];

          for (const userList of userLists) {
            if (!Array.isArray(userList)) continue;

            for (const item of userList) {
              if (!item) continue;
              const userInfo =
                item.userInfo || item.user || item.user_info || item;

              const uniqueId =
                userInfo?.uniqueId ||
                userInfo?.unique_id ||
                userInfo?.uid ||
                "";

              if (uniqueId && !seenUsernames.has(uniqueId) && uniqueId.length >= 2) {
                seenUsernames.add(uniqueId);
                suggestions.push({
                  username: uniqueId,
                  displayName:
                    userInfo?.nickname ||
                    userInfo?.displayName ||
                    userInfo?.display_name ||
                    uniqueId,
                  verified: userInfo?.verified || userInfo?.isVerified || false,
                });
              }
            }
          }
        }
      } catch {
        // JSON parse failed — continue to fallback strategies
      }
    }

    // ── Strategy 2: Regex extract uniqueId from HTML ──
    if (suggestions.length === 0) {
      const patterns = [
        /"uniqueId"\s*:\s*"([^"]+)"/g,
        /"unique_id"\s*:\s*"([^"]+)"/g,
        /\\"uniqueId\\"\s*:\s*\\"([^\\]+)\\"/g,
      ];

      for (const pattern of patterns) {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(html)) !== null) {
          const uid = match[1].toLowerCase();
          if (
            uid &&
            uid.length >= 2 &&
            uid.length <= 30 &&
            /^[a-z0-9._]+$/.test(uid) &&
            !seenUsernames.has(uid) &&
            uid !== cleanQuery
          ) {
            seenUsernames.add(uid);
            suggestions.push({
              username: uid,
              displayName: uid,
              verified: false,
            });
          }
          if (suggestions.length >= 10) break;
        }
        if (suggestions.length >= 10) break;
      }
    }

    // ── Strategy 3: Extract from TikTok card links in HTML ──
    if (suggestions.length === 0) {
      // Look for @username patterns in href attributes
      const hrefPattern = /href="https?:\/\/www\.tiktok\.com\/@([a-zA-Z0-9._]+)"/g;
      let match: RegExpExecArray | null;
      while ((match = hrefPattern.exec(html)) !== null) {
        const uid = match[1].toLowerCase();
        if (
          uid &&
          uid.length >= 2 &&
          uid !== cleanQuery &&
          !seenUsernames.has(uid)
        ) {
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

    return NextResponse.json({
      suggestions: suggestions.slice(0, 10),
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}

