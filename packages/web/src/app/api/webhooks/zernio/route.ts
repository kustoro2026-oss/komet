// API Route: Zernio Webhooks
import { NextRequest, NextResponse } from "next/server";

interface ZernioWebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-zernio-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ZernioWebhookPayload;
    const { event, data, timestamp } = body;

    if (!event || !data) {
      return NextResponse.json(
        { error: "Invalid webhook payload: event and data required" },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received event: ${event} at ${timestamp}`);

    // Handle different event types
    switch (event) {
      case "post.published":
        // Update post status in database
        console.log(`[Webhook] Post published: ${JSON.stringify(data)}`);
        break;

      case "post.failed":
        // Update post status and log error
        console.error(`[Webhook] Post failed: ${JSON.stringify(data)}`);
        break;

      case "comment.received":
        // Store comment in inbox
        console.log(`[Webhook] New comment: ${JSON.stringify(data)}`);
        break;

      case "account.expired":
        // Notify user about expired account
        console.warn(`[Webhook] Account expired: ${JSON.stringify(data)}`);
        break;

      default:
        console.log(`[Webhook] Unknown event: ${event}`, JSON.stringify(data));
    }

    return NextResponse.json({
      received: true,
      event,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Webhook] Error processing:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
