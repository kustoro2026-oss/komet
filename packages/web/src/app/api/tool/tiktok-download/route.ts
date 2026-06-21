import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface TikTokDownloadResponse {
  success: boolean;
  error?: string;
  video?: {
    id: string;
    title: string;
    cover: string;
    duration: number;
    author: {
      nickname: string;
      avatar: string;
    };
    /** Video with watermark */
    playUrl: string;
    /** Video without watermark (may be empty for some videos) */
    wmPlayUrl: string;
    /** HD video */
    hdPlayUrl: string;
    /** Audio/music only */
    musicUrl: string;
  };
}

/**
 * TikTok video downloader via tikwm.com API proxy.
 * Accepts a TikTok video URL and returns download links.
 *
 * GET /api/tool/tiktok-download?url={tiktok_video_url}
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { success: false, error: "URL parameter is required. Paste a TikTok video link." },
      { status: 400 },
    );
  }

  // Validate TikTok URL format
  const tiktokUrlPattern = /https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/.+/i;
  if (!tiktokUrlPattern.test(url.trim())) {
    return NextResponse.json(
      {
        success: false,
        error: "Please paste a valid TikTok video URL (e.g. https://www.tiktok.com/@user/video/123456 or https://vm.tiktok.com/abc/).",
      },
      { status: 400 },
    );
  }

  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url.trim())}`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `TikWM API returned status ${response.status}. The video may be private or deleted.` },
        { status: 200 },
      );
    }

    const raw = (await response.json()) as {
      code: number;
      msg?: string;
      data?: {
        id?: string;
        title?: string;
        cover?: string;
        duration?: number;
        play?: string;
        wmplay?: string;
        hdplay?: string;
        music?: string;
        author?: { nickname?: string; avatar?: string };
      };
    };

    if (raw.code !== 0 || !raw.data) {
      return NextResponse.json(
        {
          success: false,
          error: raw.msg || "Failed to fetch video. The link may be invalid or the video is private.",
        },
        { status: 200 },
      );
    }

    const d = raw.data;

    return NextResponse.json({
      success: true,
      video: {
        id: d.id || "",
        title: d.title || "TikTok Video",
        cover: d.cover || "",
        duration: d.duration || 0,
        author: {
          nickname: d.author?.nickname || "Unknown",
          avatar: d.author?.avatar || "",
        },
        playUrl: d.play || "",
        wmPlayUrl: d.wmplay || d.hdplay || "",
        hdPlayUrl: d.hdplay || "",
        musicUrl: d.music || "",
      },
    } satisfies TikTokDownloadResponse);
  } catch (error) {
    console.error("TikTok download error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Network error. Please check your connection and try again.",
      },
      { status: 200 },
    );
  }
}
