import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Workspaces where user is owner
    const { data: owned, error: ownedErr } = await supabase
      .from("workspaces")
      .select("id, name, slug, created_at")
      .eq("owner_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (ownedErr) {
      console.error("Failed to fetch owned workspaces:", ownedErr);
      return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
    }

    // Workspaces where user is a member (but not owner)
    const { data: memberRows, error: memberErr } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id);

    if (memberErr) {
      console.error("Failed to fetch workspace members:", memberErr);
      return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
    }

    const ownedIds = new Set((owned || []).map((w) => w.id));
    const memberWorkspaceIds = (memberRows || [])
      .filter((m) => !ownedIds.has(m.workspace_id))
      .map((m) => m.workspace_id);

    let memberWorkspaces: { id: string; name: string; slug: string; created_at: string }[] = [];
    if (memberWorkspaceIds.length > 0) {
      const { data: mws, error: mwsErr } = await supabase
        .from("workspaces")
        .select("id, name, slug, created_at")
        .in("id", memberWorkspaceIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (!mwsErr) memberWorkspaces = mws || [];
    }

    // Build role map
    const roleMap = new Map<string, string>();
    (memberRows || []).forEach((m) => roleMap.set(m.workspace_id, m.role));

    const allWorkspaces = [
      ...(owned || []).map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        role: "admin" as const,
      })),
      ...memberWorkspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        role: (roleMap.get(w.id) || "viewer") as "admin" | "editor" | "viewer",
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const name = body.name.trim();
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!slug) {
      return NextResponse.json({ error: "Invalid workspace name" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Insert workspace
    const { data: workspace, error: insertErr } = await supabase
      .from("workspaces")
      .insert({ name, slug, owner_id: user.id })
      .select("id, name, slug")
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        // unique violation on slug
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
        const { data: retry, error: retryErr } = await supabase
          .from("workspaces")
          .insert({ name, slug: uniqueSlug, owner_id: user.id })
          .select("id, name, slug")
          .single();

        if (retryErr) {
          console.error("Failed to create workspace (retry):", retryErr);
          return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
        }

        // Add owner as member
        await supabase.from("workspace_members").insert({
          workspace_id: retry.id,
          user_id: user.id,
          role: "admin",
        });

        return NextResponse.json(
          { workspace: { id: retry.id, name: retry.name, slug: retry.slug, role: "admin" } },
          { status: 201 }
        );
      }

      console.error("Failed to create workspace:", insertErr);
      return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
    }

    // Add owner as member
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "admin",
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
