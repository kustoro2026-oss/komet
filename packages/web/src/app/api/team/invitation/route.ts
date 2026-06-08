// API Route: Team Invitations List
// GET /api/team/invitation?workspaceId=xxx → list pending invitations
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, error } = await getUserFromRequest(request);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    const { prisma } = await import("@komet/db");
    // Verify user is owner or member of this workspace
    const [membership, isOwner] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      }),
      prisma.workspace.findFirst({
        where: { id: workspaceId, ownerId: userId, isDeleted: false },
        select: { id: true },
      }),
    ] as const);
    if (!membership && !isOwner) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        workspaceId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("[Team Invitation GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
