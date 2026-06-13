// API Route: Notifications
// Routes: GET → list | PATCH → mark read | DELETE → delete
// All operations scoped to the authenticated user
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type") || undefined;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: Record<string, unknown> = { userId: user.id };
    if (type) where.type = type;
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.notification.count({ where: where as any }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, total, unreadCount });
  } catch (err) {
    console.error("[Notifications GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Mark all as read
    if (body.markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    // Mark specific IDs as read
    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: body.ids }, userId: user.id },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing ids or markAll" }, { status: 400 });
  } catch (err) {
    console.error("[Notifications PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Clear all
    if (body.clearAll) {
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      return NextResponse.json({ success: true });
    }

    // Delete specific IDs
    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: body.ids }, userId: user.id },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing ids or clearAll" }, { status: 400 });
  } catch (err) {
    console.error("[Notifications DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
