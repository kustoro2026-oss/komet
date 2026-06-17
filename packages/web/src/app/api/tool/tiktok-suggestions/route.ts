import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface TikTokSuggestion {
  username: string;
  displayName: string;
  verified: boolean;
}

/**
 * Generate common username variations as a reliable fallback when
 * TikTok's API is unreachable or blocks the request.
 */
function generateVariations(base: string): TikTokSuggestion[] {
  const variations: TikTokSuggestion[] = [];
  const suffixes = ["1", "123", "2024", "2025", "2026", "_", "x", "tv", "id", "_official", ".real", "daily", "hub", "world"];
  const prefixes = ["real", "its", "the", "official", "iam", "hey"];

  for (const sfx of suffixes) {
    if (base.length + sfx.length <= 24) {
      variations.push({
        username: `${base}${sfx}`,
        displayName: `${base}${sfx}`,
        verified: false,
      });
    }
  }

  for (const pfx of prefixes) {
    const variant = `${pfx}${base}`;
    if (variant.length <= 24) {
      variations.push({
        username: variant,
        displayName: variant,
        verified: false,
      });
    }
  }

  // Add underscore mid-variations for multi-word-like names
  if (base.length >= 5 && base.length <= 20) {
    const mid = Math.floor(base.length / 2);
    variations.push({
      username: `${base.slice(0, mid)}_${base.slice(mid)}`,
      displayName: `${base.slice(0, mid)}_${base.slice(mid)}`,
      verified: false,
    });
  }

  return variations.slice(0, 10);
}

/**
 * Fetches similar TikTok usernames using multiple strategies:
 * 1. TikTok's search suggest API (JSON, fast)
 * 2. HTML search-page scraping with improved JSON extraction
 * 3. Heuristic username variation generator (always works)
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
  const suggestions: TikTokSuggestion[] = [];
  const seenUsernames = new Set<string>();

  const commonHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.tiktok.com/",
  };

  // ── Strategy 1: TikTok suggest API (fast, returns JSON) ──
  try {
    const suggestUrl = `https://www.tiktok.com/api/search/general/suggest/?keyword=${encodeURIComponent(cleanQuery)}&type=user`;
    const resp = await fetch(suggestUrl, {
      headers: { ...commonHeaders },
    });

    if (resp.ok) {
      const data = await resp.json() as Record<string, unknown>;
      const userList =
        (data as Record<string, unknown[]>)?.user_list ||
        (data as Record<string, unknown[]>)?.userList ||
        [];

      for (const item of Array.isArray(userList) ? userList : []) {
        const uniqueId =
          (item as Record<string, string>)?.uniqueId ||
          (item as Record<string, string>)?.unique_id ||
          (item as Record<string, string>)?.username ||
          "";

        if (
          uniqueId &&
          uniqueId.length >= 2 &&
          !seenUsernames.has(uniqueId) &&
          uniqueId !== cleanQuery
        ) {
          seenUsernames.add(uniqueId);
          suggestions.push({
            username: uniqueId,
            displayName:
              (item as Record<string, string>)?.nickname ||
              (item as Record<string, string>)?.display_name ||
              (item as Record<string, string>)?.displayName ||
              uniqueId,
            verified:
              (item as Record<string, boolean>)?.verified ||
              (item as Record<string, boolean>)?.isVerified ||
              false,
          });
        }
      }
    }
  } catch {
    // Strategy 1 failed — continue to next
  }

  // ── Strategy 2: Scrape TikTok search page HTML ──
  if (suggestions.length === 0) {
    try {
      const htmlResp = await fetch(
        `https://www.tiktok.com/search?q=${encodeURIComponent(cleanQuery)}`,
        {
          headers: {
            "User-Agent": commonHeaders["User-Agent"],
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        }
      );

      if (htmlResp.ok) {
        const html = await htmlResp.text();

        // Extract hydration JSON using indexOf (handles < inside JSON)
        const scriptStart = html.indexOf(
          '<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"'
        );
        if (scriptStart !== -1) {
          const contentStart = html.indexOf(">", scriptStart) + 1;
          const scriptEnd = html.indexOf("</script>", contentStart);
          if (scriptEnd !== -1) {
            try {
              const rawJson = html.slice(contentStart, scriptEnd);
              const data = JSON.parse(rawJson);
              const defaultScope = (data as Record<string, unknown>)?.__DEFAULT_SCOPE__ as Record<string, unknown> || {};

              const searchKeys = [
                "webapp.search-video",
                "webapp.search-general",
                "webapp.search-top",
                "webapp.search-user",
              ];

              for (const key of searchKeys) {
                const searchData = defaultScope[key] as Record<string, unknown>;
                if (!searchData) continue;

                const userLists = [
                  searchData.userList,
                  searchData.userCardList,
                  searchData.itemList,
                  searchData.user_list,
                ];

                for (const userList of userLists) {
                  if (!Array.isArray(userList)) continue;
                  for (const item of userList) {
                    const userInfo =
                      (item as Record<string, unknown>)?.userInfo ||
                      (item as Record<string, unknown>)?.user ||
                      (item as Record<string, unknown>)?.user_info ||
                      item;
                    const uniqueId =
                      (userInfo as Record<string, string>)?.uniqueId ||
                      (userInfo as Record<string, string>)?.unique_id ||
                      "";

                    if (
                      uniqueId &&
                      uniqueId.length >= 2 &&
                      !seenUsernames.has(uniqueId) &&
                      uniqueId !== cleanQuery
                    ) {
                      seenUsernames.add(uniqueId);
                      suggestions.push({
                        username: uniqueId,
                        displayName:
                          (userInfo as Record<string, string>)?.nickname ||
                          (userInfo as Record<string, string>)?.displayName ||
                          (userInfo as Record<string, string>)?.display_name ||
                          uniqueId,
                        verified:
                          (userInfo as Record<string, boolean>)?.verified ||
                          (userInfo as Record<string, boolean>)?.isVerified ||
                          false,
                      });
                    }
                  }
                }
              }
            } catch {
              // JSON parse failed - try regex fallback
            }
          }
        }

        // Regex fallback for uniqueId patterns in raw HTML
        if (suggestions.length === 0) {
          const uidRegex = /"uniqueId"\s*:\s*"([^"]+)"/g;
          let match: RegExpExecArray | null;
          while ((match = uidRegex.exec(html)) !== null) {
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
              suggestions.push({ username: uid, displayName: uid, verified: false });
            }
            if (suggestions.length >= 10) break;
          }
        }
      }
    } catch {
      // Strategy 2 failed — continue to fallback
    }
  }

  // ── Strategy 3: Generate heuristic username variations ──
  if (suggestions.length === 0) {
    const generated = generateVariations(cleanQuery);
    for (const g of generated) {
      if (!seenUsernames.has(g.username)) {
        seenUsernames.add(g.username);
        suggestions.push(g);
      }
    }
  }

  return NextResponse.json({
    suggestions: suggestions.slice(0, 10),
  });
}
