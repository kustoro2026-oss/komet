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

export async function POST(request: NextRequest) {
  const { user, error } = await getUserFromRequest(request);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  try {
    const body = await request.json();
    const { workspaceId, email, role } = body as { workspaceId: string; email: string; role: string };

    if (!workspaceId || !email || !role) {
      return NextResponse.json({ error: "workspaceId, email, and role are required" }, { status: 400 });
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be admin, editor, or viewer" }, { status: 400 });
    }

    const { prisma } = await import("@komet/db");

    // Verify user is owner or admin of this workspace
    const isOwner = await prisma.workspace.findFirst({
      where: { id: workspaceId, ownerId: userId, isDeleted: false },
      select: { id: true },
    });

    if (!isOwner) {
      const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      });
      if (!membership || membership.role !== "admin") {
        return NextResponse.json({ error: "Only workspace admins can send invitations" }, { status: 403 });
      }
    }

    // Check for existing pending invitation to same email
    const existing = await prisma.teamInvitation.findFirst({
      where: {
        workspaceId,
        email: email.toLowerCase(),
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "An active invitation already exists for this email" }, { status: 409 });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (existingMember) {
        return NextResponse.json({ error: "This user is already a member of the workspace" }, { status: 409 });
      }
    }

    // Generate a unique token
    const token = crypto.randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komet.so";
    const inviteLink = `${baseUrl}/invite/${token}`;

    // Create invitation (expires in 7 days)
    const invitation = await prisma.teamInvitation.create({
      data: {
        workspaceId,
        email: email.toLowerCase(),
        role,
        token,
        status: "pending",
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        token: true,
      },
    });

    // Send invitation email (best-effort, don't fail the request)
    let emailSent = false;
    let emailError: string | null = null;
    try {
      const { emailService } = await import("@komet/email");
      const w = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      });
      const inviterUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      const inviterName = inviterUser?.name || inviterUser?.email?.split("@")[0] || "Someone";
      const workspaceName = w?.name || "Workspace";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komet.so";
      const inviteLink = `${baseUrl}/invite/${token}`;
      emailSent = await emailService.sendTemplate("team_invite", email.toLowerCase(), {
        workspaceName,
        inviterName,
        inviteLink,
      });
    } catch (emailErr) {
      emailError = String(emailErr);
      console.error("[Invite email] Error:", emailErr);
      // Don't fail the request — invitation is created, email is best-effort
    }

    return NextResponse.json({
      invitation,
      inviteLink,
      emailSent,
      emailError: emailSent ? null : (emailError || "Email delivery failed — check server logs or RESEND_API_KEY"),
    }, { status: 201 });
  } catch (error) {
    console.error("[Team Invitation POST] Error:", error);
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await getUserFromRequest(request);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");

    if (!invitationId) {
      return NextResponse.json({ error: "id parameter required" }, { status: 400 });
    }

    const { prisma } = await import("@komet/db");

    // Verify user owns the workspace this invitation belongs to
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      select: { id: true, workspaceId: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const isOwner = await prisma.workspace.findFirst({
      where: { id: invitation.workspaceId, ownerId: userId, isDeleted: false },
      select: { id: true },
    });

    if (!isOwner) {
      const membership = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId } },
      });
      if (!membership || membership.role !== "admin") {
        return NextResponse.json({ error: "Only workspace admins can cancel invitations" }, { status: 403 });
      }
    }

    await prisma.teamInvitation.delete({ where: { id: invitationId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Team Invitation DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 });
  }
}
