import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { accountId: string } },
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = params;
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const body = await request.json();
    const { platformAccountId } = body;

    if (platformAccountId === undefined) {
      return NextResponse.json({ error: "platformAccountId is required" }, { status: 400 });
    }

    // Verify ownership
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        profile: {
          workspace: {
            ownerId: user.id,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Only allow updating platformAccountId for Telegram accounts
    if (account.platform !== "telegram") {
      return NextResponse.json(
        { error: "Destination selection is only supported for Telegram" },
        { status: 400 },
      );
    }

    const updated = await prisma.socialAccount.update({
      where: { id: accountId },
      data: { platformAccountId },
      select: {
        id: true,
        platform: true,
        platformAccountId: true,
        username: true,
        displayName: true,
      },
    });

    return NextResponse.json({
      success: true,
      account: updated,
    });
  } catch (err) {
    console.error("[Account PATCH] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update account" },
      { status: 500 },
    );
  }
}
