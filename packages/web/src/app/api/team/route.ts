// API Route: Team Management
// GET  /api/team?workspaceId=xxx → list members
// POST /api/team → invite new member
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { emailService } from "@komet/email";
import { randomUUID } from "crypto";

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

    // Fetch all members with user details
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            supabaseId: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    const result = members.map((m: { id: string; role: string; user: { id: string; supabaseId: string; name: string | null; email: string; avatarUrl: string | null; createdAt: Date } }) => ({
      id: m.id,
      userId: m.user.id,
      supabaseId: m.user.supabaseId,
      name: m.user.name || m.user.email,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      status: "active" as const,
      joinedAt: m.user.createdAt.toISOString(),
      initials: (m.user.name || m.user.email)
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    }));

    return NextResponse.json({ members: result });
  } catch (error) {
    console.error("[Team GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
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
    const { workspaceId, email, role } = body as {
      workspaceId: string;
      email: string;
      role: string;
    };

    if (!workspaceId || !email || !role) {
      return NextResponse.json(
        { error: "workspaceId, email, and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    // Only admin or owner can invite
    const [membership, isOwner] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      }),
      prisma.workspace.findFirst({
        where: { id: workspaceId, ownerId: userId, isDeleted: false },
        select: { id: true },
      }),
    ] as const);
    if ((!membership || membership.role !== "admin") && !isOwner) {
      return NextResponse.json(
        { error: "Only admins can invite members" },
        { status: 403 }
      );
    }

    // Check if email is already a member of this workspace
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: existingUser.id },
        },
      });
      if (existingMember) {
        return NextResponse.json(
          { error: "This user is already a member of this workspace" },
          { status: 409 }
        );
      }
    }

    // Create invitation
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.teamInvitation.create({
      data: {
        workspaceId,
        email: email.toLowerCase(),
        role,
        invitedBy: userId,
        token,
        expiresAt,
      },
    });

    // Get workspace and inviter details for email
    const [workspace, inviter] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ]);

    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite/${token}`;

    try {
      await emailService.sendTemplate("team_invite", email, {
        workspaceName: workspace?.name || "Komet",
        inviterName: inviter?.name || "A team member",
        inviteLink,
      });
    } catch (emailErr) {
      console.warn("[Team POST] Email sending failed:", emailErr);
      // Don't fail the invite — email is best-effort
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Team POST] Error:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
