// API Route: Accept Team Invitation
// GET  /api/team/invitation/[token] → validate invitation (check status, expired?)
// POST /api/team/invitation/[token] → accept invitation
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseClient } from "@komet/auth";

export const dynamic = "force-dynamic";

async function getAuthenticatedSupabaseId(request: NextRequest): Promise<string | null> {
  try {
    const supabase = createSupabaseClient();
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);

    const { data } = await supabase.auth.getUser(token);
    return data.user?.id || null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.status === "accepted") {
      return NextResponse.json({
        valid: false,
        reason: "already_accepted",
        invitation: {
          workspaceName: invitation.workspace.name,
          role: invitation.role,
          email: invitation.email,
        },
      });
    }

    if (invitation.status === "expired" || invitation.expiresAt < new Date()) {
      // Mark as expired if it passed the date
      if (invitation.status !== "expired") {
        await prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { status: "expired" },
        });
      }
      return NextResponse.json({
        valid: false,
        reason: "expired",
        invitation: {
          workspaceName: invitation.workspace.name,
          role: invitation.role,
          email: invitation.email,
        },
      });
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        workspaceId: invitation.workspace.id,
        workspaceName: invitation.workspace.name,
        role: invitation.role,
        email: invitation.email,
      },
    });
  } catch (error) {
    console.error("[Team Invitation GET] Error:", error);
    return NextResponse.json({ error: "Failed to validate invitation" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabaseId = await getAuthenticatedSupabaseId(request);
  if (!supabaseId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = params;

  try {
    // Find the Komet user
    const user = await prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true, email: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "User account not found. Please complete signup first." },
        { status: 404 }
      );
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `Invitation is ${invitation.status}` },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    // Verify email matches (the authenticated user's email must match the invite)
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation is for a different email address" },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
    });
    if (existingMember) {
      // Already a member, mark invitation as accepted
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });
      return NextResponse.json({
        accepted: true,
        workspaceId: invitation.workspaceId,
        message: "You are already a member of this workspace",
      });
    }

    // Add to workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    });

    return NextResponse.json({
      accepted: true,
      workspaceId: invitation.workspaceId,
    });
  } catch (error) {
    console.error("[Team Invitation POST] Error:", error);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
