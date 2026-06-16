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
    const pinterestApiBase = process.env.PINTEREST_API_BASE_URL || "https://api-sandbox.pinterest.com";
    const boardsUrl = `${pinterestApiBase}/v5/boards?page_size=100`;
    console.log("[Pinterest Boards] Fetching from:", boardsUrl);
    const res = await fetch(
      boardsUrl,
      {
        headers: { Authorization: `Bearer ${account.accessToken}` },
      }
    );

    console.log("[Pinterest Boards] Response status:", res.status);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[Pinterest Boards] Error response:", errText.substring(0, 500));
      return NextResponse.json(
        { error: `Failed to fetch boards: ${res.status} ${errText.substring(0, 200)}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      items?: PinterestBoard[];
      page?: { cursor?: string };
    };

    console.log("[Pinterest Boards] Items count:", data.items?.length ?? 0);
    console.log("[Pinterest Boards] Raw data keys:", Object.keys(data));

    const boards = (data.items || []).map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description || "",
      privacy: b.privacy || "PUBLIC",
    }));

    // Auto-create a default board in sandbox if no boards exist
    if (boards.length === 0) {
      console.log("[Pinterest Boards] No boards found, creating default board in sandbox...");
      const createRes = await fetch(`${pinterestApiBase}/v5/boards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Komet Pins",
          description: "Pins published from Komet",
          privacy: "PUBLIC",
        }),
      });

      console.log("[Pinterest Boards] Create board status:", createRes.status);

      if (createRes.ok) {
        const newBoard = (await createRes.json()) as PinterestBoard;
        console.log("[Pinterest Boards] Created board:", newBoard.id, newBoard.name);
        boards.push({
          id: newBoard.id,
          name: newBoard.name,
          description: newBoard.description || "",
          privacy: newBoard.privacy || "PUBLIC",
        });
      } else {
        const errText = await createRes.text().catch(() => "");
        console.error("[Pinterest Boards] Failed to create board:", errText.substring(0, 500));
      }
    }

    return NextResponse.json({ boards });
  } catch (err) {
    console.error("[Pinterest Boards] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
