// API Route: Webhook Management
// Proxies webhook management calls to Zernio API
// Routes: GET /api/webhooks/manage → list | POST → create | DELETE → delete | POST /test → test
import { NextRequest, NextResponse } from "next/server";
import { ZernioClient } from "@komet/zernio-client";

export const dynamic = "force-dynamic";

function getClient(): ZernioClient | null {
  const apiKey = process.env.ZERNIO_API_KEY;
  if (!apiKey) return null;
  return new ZernioClient(apiKey);
}

export async function GET() {
  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: "Zernio API key not configured" },
      { status: 500 }
    );
  }

  try {
    const result = await client.getWebhookSettings();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("[Webhook Manage] GET error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to fetch webhooks" },
      { status: err.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: "Zernio API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { name, url, events, secret, isActive, customHeaders } = body;

    // Check if this is a test request (POST /test)
    const urlPath = request.nextUrl.pathname;
    if (urlPath.endsWith("/test")) {
      const { webhookId } = body;
      if (!webhookId) {
        return NextResponse.json(
          { error: "webhookId required for test" },
          { status: 400 }
        );
      }
      const result = await client.testWebhook(webhookId);
      return NextResponse.json(result);
    }

    // Create webhook
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "name, url, and events (with at least 1 event) are required" },
        { status: 400 }
      );
    }

    const result = await client.createWebhookSettings({
      name,
      url,
      events,
      secret,
      isActive,
      customHeaders,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("[Webhook Manage] POST error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to create webhook" },
      { status: err.status || 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: "Zernio API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { webhookId } = await request.json();
    if (!webhookId) {
      return NextResponse.json(
        { error: "webhookId required" },
        { status: 400 }
      );
    }

    const result = await client.deleteWebhookSettings(webhookId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("[Webhook Manage] DELETE error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to delete webhook" },
      { status: err.status || 500 }
    );
  }
}
