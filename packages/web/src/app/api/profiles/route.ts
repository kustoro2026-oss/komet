import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

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

    const profiles = await prisma.profile.findMany({
      where: {
        workspace: {
          ownerId: kometUser.id,
        },
      },
      select: {
        id: true,
        name: true,
        isDefault: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Profiles list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
    }

    const { prisma } = await import("@komet/db");

    const kometUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!kometUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create default workspace for this user
    let workspace = await prisma.workspace.findFirst({
      where: { ownerId: kometUser.id },
      orderBy: { createdAt: "asc" },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "My Workspace",
          slug: `workspace-${kometUser.id.substring(0, 8)}`,
          ownerId: kometUser.id,
        },
      });
    }

    const profile = await prisma.profile.create({
      data: {
        name,
        description: description || null,
        color: color || "#3B82F6",
        workspaceId: workspace.id,
      },
      select: { id: true, name: true, isDefault: true },
    });

    return NextResponse.json({ id: profile.id, name: profile.name }, { status: 201 });
  } catch (error) {
    console.error("Profile create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
