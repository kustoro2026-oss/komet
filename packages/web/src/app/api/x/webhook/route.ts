// X Activity API (XAA) Webhook Endpoint
// GET  = CRC challenge-response check
// POST = Receive XAA events from X

import { NextRequest, NextResponse } from "next/server";
import { buildCrcResponse, verifySignature, processEvent } from "@/lib/x-activity";
import type { XActivityEvent } from "@/lib/x-activity";

export const dynamic = "force-dynamic";

/**
 * GET — CRC (Challenge-Response Check)
 * X sends ?crc_token=... to verify we control this endpoint.
 * We respond with HMAC SHA-256 of crc_token using consumer secret.
 */
export async function GET(request: NextRequest) {
  try {
    const crcToken = request.nextUrl.searchParams.get("crc_token");
    if (!crcToken) {
      return NextResponse.json({ error: "Missing crc_token" }, { status: 400 });
    }

    const responseToken = buildCrcResponse(crcToken);
    return NextResponse.json({ response_token: responseToken });
  } catch (err) {
    console.error("[X Webhook] CRC error:", err);
    return NextResponse.json({ error: "CRC failed" }, { status: 500 });
  }
}

/**
 * POST — Receive XAA events
 * X sends events as JSON payloads with signature in x-twitter-webhooks-signature header.
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify signature (optional but recommended)
    const signature = request.headers.get("x-twitter-webhooks-signature");
    if (signature) {
      const isValid = verifySignature(rawBody, signature);
      if (!isValid) {
        console.error("[X Webhook] Invalid signature — rejecting event");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Parse the event payload
    const event: XActivityEvent = JSON.parse(rawBody);
    console.log("[X Webhook] Received event:", event.event_type, "| uuid:", event.event_uuid);

    // Process the event (fire-and-forget to avoid timeout)
    void processEvent(event).catch((err) => {
      console.error("[X Webhook] Event processing failed:", err);
    });

    // Always respond 200 quickly (X requires < 10s response)
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[X Webhook] POST error:", err);
    // Return 200 even on error to avoid X retry storms
    return NextResponse.json({ received: false, error: "Processing error" });
  }
}
