// POST /api/pinterest/board — Save selected board as platformAccountId for a Pinterest account
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const accountId = body?.accountId as string | undefined;
    const boardId = body?.boardId as string | undefined;

    if (!accountId || !boardId) {
      return NextResponse.json({ error: "accountId and boardId are required" }, { status: 400 });
    }

    // Verify account belongs to user's profile
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, platform: "pinterest" },
      include: { profile: { select: { workspaceId: true } } },
    });

    if (!account) {
      return NextResponse.json({ error: "Pinterest account not found" }, { status: 404 });
    }

    // Update platformAccountId to the selected board ID
    await prisma.socialAccount.update({
      where: { id: accountId },
      data: { platformAccountId: boardId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Pinterest Board Save] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
