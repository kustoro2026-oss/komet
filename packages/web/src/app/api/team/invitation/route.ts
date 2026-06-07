// API Route: Team Invitations List
// GET /api/team/invitation?workspaceId=xxx → list pending invitations
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@komet/db";
import { createSupabaseClient } from "@komet/auth";

export const dynamic = "force-dynamic";

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    const supabase = createSupabaseClient();
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);

    const { data } = await supabase.auth.getUser(token);
    if (!data.user) return null;

    const user = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
      select: { id: true },
    });
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    if (!membership) {
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
