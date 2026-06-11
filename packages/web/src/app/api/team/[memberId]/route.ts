// API Route: Team Member Management
// PATCH  /api/team/[memberId] → change role
// DELETE /api/team/[memberId] → remove member
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  const { user, error } = await getUserFromRequest(request);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  const { memberId } = params;

  try {
    const body = await request.json();
    const { role } = body as { role: string };

    if (!role || !["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    // Get the target member to check workspace
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Only admin can change roles
    const currentMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: targetMember.workspaceId,
          userId,
        },
      },
    });
    if (!currentMembership || currentMembership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can change member roles" },
        { status: 403 }
      );
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("[Team PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  const { user, error } = await getUserFromRequest(request);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const { memberId } = params;

  try {
    // Get the target member to check workspace
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Only admin can remove members
    const currentMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: targetMember.workspaceId,
          userId,
        },
      },
    });
    if (!currentMembership || currentMembership.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      );
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Team DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
