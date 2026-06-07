// API Route: Webhook Events Receiver
// Receives webhook events from the platform per docs
// Handles all 33 event types, verifies signatures, stores events via /tmp
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

/* ───────── All 33 webhook event types ───────── */
const WEBHOOK_EVENTS = [
  // Post events
  "post.published",
  "post.failed",
  "post.partial",
  "post.cancelled",
  "post.scheduled",
  "post.recycled",
  "post.external.created",
  "post.external.updated",
  "post.external.deleted",
  // Account events
  "account.connected",
  "account.disconnected",
  "account.ads.initial_sync_completed",
  // Message events
  "message.received",
  "message.sent",
  "conversation.started",
  "message.edited",
  "message.deleted",
  "message.delivered",
  "message.read",
  "message.failed",
  // Reactions & Comments
  "reaction.received",
  "comment.received",
  // Reviews
  "review.new",
  "review.updated",
  // Leads & Ads
  "lead.received",
  "ad.status_changed",
  // WhatsApp
  "whatsapp.number.activated",
  "whatsapp.number.declined",
  "whatsapp.number.verification_required",
  "whatsapp.number.suspended",
  "whatsapp.number.reactivated",
  "whatsapp.number.released",
  // Test
  "webhook.test",
] as const;

type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

/* ───────── Event storage path (Vercel-compatible /tmp) ───────── */
const EVENTS_FILE = path.join("/tmp", "webhook-events.json");
const EVENTS_MAX = 500; // keep last 500 events

interface StoredEvent {
  id: string; // Event ID (deduplication key)
  event: WebhookEventType;
  payload: unknown;
  receivedAt: string;
  isRead: boolean;
}

/* ───────── Helpers ───────── */

function loadEvents(): StoredEvent[] {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const raw = fs.readFileSync(EVENTS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveEvents(events: StoredEvent[]) {
  const trimmed = events.slice(-EVENTS_MAX);
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}

function findExisting(id: string): StoredEvent | undefined {
  return loadEvents().find((e) => e.id === id);
}

function appendEvent(event: StoredEvent) {
  const events = loadEvents();
  events.push(event);
  saveEvents(events);
}

/* ───────── Signature verification ───────── */

function verifySignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const computed = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

/* ═══════════════════════════════════════
   MAIN HANDLER
   ═══════════════════════════════════════ */

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    // ── Read raw body for signature verification ──
    const rawBody = await request.text();

    const signature =
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-late-signature");

    const eventId =
      request.headers.get("x-webhook-event-id") ||
      request.headers.get("x-late-event-id");

    // ── Signature verification (if secret configured) ──
    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      if (!signature) {
        return NextResponse.json(
          { error: "Missing webhook signature" },
          { status: 401 }
        );
      }
      if (!verifySignature(rawBody, signature, secret)) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    }

    // ── Parse payload ──
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Extract event type — platform sends `event` at top level
    const body = payload as Record<string, unknown>;
    const eventType = body.event as string | undefined;
    const id = (body.id as string) || eventId;

    if (!eventType || !WEBHOOK_EVENTS.includes(eventType as WebhookEventType)) {
      console.warn(`[Webhook Events] Unknown or missing event: ${eventType}`);
      return NextResponse.json({ received: true, warning: "Unknown event type" });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing event ID for idempotency" },
        { status: 400 }
      );
    }

    // ── Idempotency check ──
    const existing = findExisting(id);
    if (existing) {
      console.log(`[Webhook Events] Duplicate event ${id} (${eventType}), skipped`);
      return NextResponse.json({ received: true, deduplicated: true });
    }

    // ── Log and store ──
    console.log(
      `[Webhook Events] ${eventType} | id=${id} | ${Date.now() - start}ms`
    );

    appendEvent({
      id,
      event: eventType as WebhookEventType,
      payload: body,
      receivedAt: new Date().toISOString(),
      isRead: false,
    });

    // ── Respond fast (platform expects 2xx within 5s) ──
    return NextResponse.json({
      received: true,
      event: eventType,
      id,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Webhook Events] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/* ───── GET: List stored events ───── */
export async function GET() {
  try {
    const events = loadEvents();
    const unread = events.filter((e) => !e.isRead).length;
    return NextResponse.json({ events, total: events.length, unread });
  } catch {
    return NextResponse.json({ events: [], total: 0, unread: 0 });
  }
}

/* ───── PATCH: Mark events as read ───── */
export async function PATCH(request: NextRequest) {
  try {
    const { ids, markAll } = await request.json();
    const events = loadEvents();

    if (markAll) {
      events.forEach((e) => (e.isRead = true));
    } else if (Array.isArray(ids)) {
      events.forEach((e) => {
        if (ids.includes(e.id)) e.isRead = true;
      });
    }

    saveEvents(events);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/* ───── DELETE: Clear events ───── */
export async function DELETE(request: NextRequest) {
  try {
    const { ids, clearAll } = await request.json();

    if (clearAll) {
      saveEvents([]);
    } else if (Array.isArray(ids)) {
      const events = loadEvents().filter((e) => !ids.includes(e.id));
      saveEvents(events);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
