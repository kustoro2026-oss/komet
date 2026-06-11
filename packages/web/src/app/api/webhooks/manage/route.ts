// API Route: Webhook Management
// Routes: GET /api/webhooks/manage → list | POST → create | PUT → update | DELETE → delete
// All operations scoped to the authenticated user's workspace
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Helper: resolve workspace for the authenticated user
async function resolveWorkspace(userId: string, workspaceId?: string | null) {

  if (workspaceId) {
    // Verify user has access to this workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });
    return workspace;
  }

  // Default to first workspace the user owns
  return prisma.workspace.findFirst({
    where: { ownerId: userId, isDeleted: false },
    orderBy: { createdAt: "asc" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const workspace = await resolveWorkspace(user.id, workspaceId);

    if (!workspace) {
      return NextResponse.json({ webhooks: [] });
    }

    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    // Map to match expected shape (similar to ZernioWebhook)
    const mapped = (webhooks as Record<string, unknown>[]).map((w) => ({
      _id: w.id,
      name: w.name,
      url: w.url,
      secret: w.secret,
      events: w.events as string[],
      customHeaders: w.customHeaders as Record<string, string> | undefined,
      isActive: w.isActive,
      failureCount: w.failureCount,
      lastFiredAt: (w.lastDeliveryAt as Date | null)?.toISOString(),
    }));

    return NextResponse.json({ webhooks: mapped });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Webhook Manage] GET error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to fetch webhooks" },
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
    const { name, url, events, secret, isActive, customHeaders } = body;

    // Validation
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "name, url, and events (with at least 1 event) are required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const workspace = await resolveWorkspace(user.id, workspaceId);

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Auto-generate secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString("hex");

    const webhook = (await prisma.webhookEndpoint.create({
      data: {
        workspaceId: workspace.id,
        name,
        url,
        secret: webhookSecret,
        events,
        customHeaders: customHeaders || {},
        isActive: isActive ?? true,
      },
    })) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      webhook: {
        _id: webhook.id,
        name: webhook.name as string,
        url: webhook.url as string,
        secret: webhook.secret as string | undefined,
        events: webhook.events as string[],
        customHeaders: webhook.customHeaders as Record<string, string> | undefined,
        isActive: webhook.isActive as boolean,
        failureCount: webhook.failureCount as number,
        lastFiredAt: (webhook.lastDeliveryAt as Date | null)?.toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Webhook Manage] POST error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to create webhook" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const body = await request.json();
    const { webhookId, name, url, events, secret, isActive, customHeaders } = body;

    if (!webhookId) {
      return NextResponse.json({ error: "webhookId required" }, { status: 400 });
    }

    // Verify webhook belongs to user's workspace
    const existing = await prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
      include: { workspace: { select: { ownerId: true } } },
    });

    if (!existing || existing.workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = events;
    if (secret !== undefined) updateData.secret = secret;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (customHeaders !== undefined) updateData.customHeaders = customHeaders;

    const updated = (await prisma.webhookEndpoint.update({
      where: { id: webhookId },
      data: updateData,
    })) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      webhook: {
        _id: updated.id as string,
        name: updated.name as string,
        url: updated.url as string,
        secret: updated.secret as string | undefined,
        events: updated.events as string[],
        customHeaders: updated.customHeaders as Record<string, string> | undefined,
        isActive: updated.isActive as boolean,
        failureCount: updated.failureCount as number,
        lastFiredAt: (updated.lastDeliveryAt as Date | null)?.toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Webhook Manage] PUT error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to update webhook" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const { webhookId } = await request.json();
    if (!webhookId) {
      return NextResponse.json({ error: "webhookId required" }, { status: 400 });
    }

    // Verify webhook belongs to user's workspace
    const existing = await prisma.webhookEndpoint.findUnique({
      where: { id: webhookId },
      include: { workspace: { select: { ownerId: true } } },
    });

    if (!existing || existing.workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    await prisma.webhookEndpoint.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Webhook Manage] DELETE error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
