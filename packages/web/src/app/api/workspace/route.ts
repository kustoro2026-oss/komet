import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@komet/db");

    const kometUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!kometUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Workspaces where user is owner
    const owned = await prisma.workspace.findMany({
      where: { ownerId: kometUser.id, isDeleted: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true },
    });

    // Workspaces where user is a member (but not owner)
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: kometUser.id },
      select: {
        workspaceId: true,
        role: true,
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const ownedIds = new Set(owned.map((w) => w.id));

    const allWorkspaces = [
      ...owned.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        role: "admin" as const,
      })),
      ...memberships
        .filter((m) => !ownedIds.has(m.workspaceId))
        .map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          role: (m.role || "viewer") as "admin" | "editor" | "viewer",
        })),
    ];

    return NextResponse.json({ workspaces: allWorkspaces });
  } catch (err) {
    console.error("Workspace list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@komet/db");

    const kometUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!kometUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const name = body.name.trim();
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!slug) {
      return NextResponse.json({ error: "Invalid workspace name" }, { status: 400 });
    }

    // Create workspace with owner as admin member
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        ownerId: kometUser.id,
        members: {
          create: {
            userId: kometUser.id,
            role: "admin",
          },
        },
      },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json(
      { workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug, role: "admin" } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Workspace create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
