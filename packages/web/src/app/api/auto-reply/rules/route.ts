// API Route: Auto-Reply Rules Sync
// Syncs rules from the browser to the server-side JSON file for cron job access
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getUserFromRequest } from "@/lib/supabase-admin";

// Force dynamic — Vercel static routes reject PUT
// Also use /tmp for Vercel serverless (only /tmp is writable)
export const dynamic = "force-dynamic";
const RULES_FILE = path.join("/tmp", "auto-reply-rules.json");

export async function GET() {
  try {
    const raw = await fs.readFile(RULES_FILE, "utf-8");
    const rules = JSON.parse(raw);
    return NextResponse.json({ rules });
  } catch {
    return NextResponse.json({ rules: [] });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rules } = body as { rules: unknown[]; userId?: string };

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: "Rules must be an array" }, { status: 400 });
    }

    // Get userId from auth session (frontend sync) or from body (cron/admin)
    let userId = "";
    const { user } = await getUserFromRequest(request);
    if (user?.id) {
      userId = user.id;
    } else if (body && typeof body === "object" && "userId" in body) {
      userId = (body as { userId: string }).userId;
    }

    // Only keep server-relevant fields
    interface ServerRule {
      id: string;
      name: string;
      trigger: { type: string; keywords?: string[] };
      reply: string;
      platforms: string[];
      source: string;
      isActive: boolean;
      createdAt: string;
    }
    const typedRules = rules as ServerRule[];
    const serverRules = typedRules.map((r) => ({
      id: r.id,
      name: r.name,
      trigger: r.trigger,
      reply: r.reply,
      platforms: r.platforms,
      source: r.source,
      isActive: r.isActive,
      createdAt: r.createdAt,
      userId: userId || "",
    }));

    await fs.writeFile(RULES_FILE, JSON.stringify(serverRules, null, 2), "utf-8");
    return NextResponse.json({ success: true, count: serverRules.length });
  } catch (error) {
    console.error("Auto-reply rules sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
