// API Route: Cleanup temporary media after post is published
// POST: accepts { mediaIds: string[] } — deletes files from Supabase storage + DB records
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@komet/db");
    const body = await request.json();
    const mediaIds: string[] = body.mediaIds || [];

    if (!mediaIds.length) {
      return NextResponse.json({ error: "No media IDs provided" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Find media records owned by this user
    const mediaRecords = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        userId: user.id,
      },
      select: { id: true, url: true, key: true },
    });

    const cleanupResults = [];
    for (const record of mediaRecords) {
      // Extract file path from URL or use stored key
      const filePath = record.key || record.url.split("/").pop() || "";
      if (!filePath) continue;

      try {
        // Delete from Supabase storage
        const { error: deleteError } = await supabase.storage
          .from("media")
          .remove([filePath]);

        if (deleteError) {
          console.warn(`Failed to delete ${filePath}:`, deleteError.message);
        }

        // Delete from database
        await prisma.media.delete({ where: { id: record.id } });

        cleanupResults.push({ id: record.id, status: "deleted" });
      } catch (err) {
        cleanupResults.push({
          id: record.id,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      cleaned: cleanupResults.length,
      results: cleanupResults,
    });
  } catch (error) {
    console.error("Media cleanup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
