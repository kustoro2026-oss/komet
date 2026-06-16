// GET /api/pinterest/boards?accountId=xxx — List Pinterest boards for a connected account
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  owner?: { username?: string };
  privacy?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, platform: "pinterest" },
    });

    if (!account?.accessToken) {
      return NextResponse.json({ error: "Pinterest account not found" }, { status: 404 });
    }

    // Fetch boards from Pinterest API (paginated, limit 100)
    const res = await fetch(
      "https://api.pinterest.com/v5/boards?page_size=100",
      {
        headers: { Authorization: `Bearer ${account.accessToken}` },
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Failed to fetch boards: ${res.status} ${errText.substring(0, 200)}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      items?: PinterestBoard[];
      page?: { cursor?: string };
    };

    const boards = (data.items || []).map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description || "",
      privacy: b.privacy || "PUBLIC",
    }));

    return NextResponse.json({ boards });
  } catch (err) {
    console.error("[Pinterest Boards] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
