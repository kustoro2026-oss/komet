import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = params;

    // Verify membership
    const { data: membership, error: memberErr } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberErr) {
      return NextResponse.json({ error: "Failed to verify access" }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { data: workspace, error: wsErr } = await supabase
      .from("workspaces")
      .select("id, name, slug, description, owner_id, created_at")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (wsErr || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get members
    const { data: members } = await supabase
      .from("workspace_members")
      .select("user_id, role, joined_at")
      .eq("workspace_id", id);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        role: membership.role,
        ownerId: workspace.owner_id,
        createdAt: workspace.created_at,
        memberCount: (members || []).length,
      },
    });
  } catch (err) {
    console.error("Workspace get error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = params;

    // Verify ownership
    const { data: workspace, error: wsErr } = await supabase
      .from("workspaces")
      .select("id, owner_id")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (wsErr || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: "Only the workspace owner can update settings" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
      updateData.slug = body.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }

    if (typeof body.description === "string") {
      updateData.description = body.description.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: updated, error: updateErr } = await supabase
      .from("workspaces")
      .update(updateData)
      .eq("id", id)
      .select("id, name, slug")
      .single();

    if (updateErr) {
      console.error("Failed to update workspace:", updateErr);
      return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
    }

    return NextResponse.json({ workspace: updated });
  } catch (err) {
    console.error("Workspace update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = params;

    // Verify ownership
    const { data: workspace, error: wsErr } = await supabase
      .from("workspaces")
      .select("id, owner_id")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (wsErr || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: "Only the workspace owner can delete it" }, { status: 403 });
    }

    // Soft delete
    const { error: deleteErr } = await supabase
      .from("workspaces")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (deleteErr) {
      console.error("Failed to delete workspace:", deleteErr);
      return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Workspace delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
