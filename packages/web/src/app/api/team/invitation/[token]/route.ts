// API Route: Team Invitation Token Actions
// GET  /api/team/invitation/[token] → validate invitation
// POST /api/team/invitation/[token] → accept invitation
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        workspaceId: true,
        workspace: { select: { name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json({
        valid: false,
        reason: "already_accepted",
        invitation: {
          workspaceName: invitation.workspace?.name || "Workspace",
          role: invitation.role,
          email: invitation.email,
        },
      });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: "expired",
        invitation: {
          workspaceName: invitation.workspace?.name || "Workspace",
          role: invitation.role,
          email: invitation.email,
        },
      });
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        workspaceId: invitation.workspaceId,
        workspaceName: invitation.workspace?.name || "Workspace",
        role: invitation.role,
        email: invitation.email,
      },
    });
  } catch (error) {
    console.error("[Team Invitation Token GET] Error:", error);
    return NextResponse.json({ valid: false, reason: "error", error: "Failed to validate invitation" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const { user, error } = await getUserFromRequest(request);

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized — please log in first" }, { status: 401 });
  }

  try {

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 409 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    // Verify the accepting user's email matches the invitation
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: `This invitation is for ${invitation.email}. Please log in with that email address.` },
        { status: 403 }
      );
    }

    // Accept the invitation: create workspace member + mark invitation as accepted
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role as "admin" | "editor" | "viewer",
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      workspaceId: invitation.workspaceId,
      role: invitation.role,
    });
  } catch (error) {
    console.error("[Team Invitation Token POST] Error:", error);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
