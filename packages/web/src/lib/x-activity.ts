// X Activity API (XAA) — webhook registration, subscriptions, and event handling.
// Uses OAuth 2.0 App-only Bearer Token (not user access token).

import crypto from "crypto";
import { prisma } from "@/lib/supabase-admin";

// ─── Helpers ────────────────────────────────────────────────────────

function getBearerToken(): string {
  return process.env.TWITTER_BEARER_TOKEN || "";
}

function getConsumerSecret(): string {
  return process.env.TWITTER_CONSUMER_SECRET || "";
}

function getBaseUrl() {
  return "https://api.x.com";
}

async function appOnlyFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getBearerToken();
  if (!token) throw new Error("TWITTER_BEARER_TOKEN is not configured");
  return fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });
}

// ─── Webhook Management ─────────────────────────────────────────────

export interface XWebhook {
  id: string;
  url: string;
  valid: boolean;
  created_at: string;
}

/** Register a new webhook URL. X immediately sends a CRC GET request. */
export async function registerWebhook(url: string): Promise<XWebhook> {
  const res = await appOnlyFetch("/2/webhooks", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to register webhook: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { data: XWebhook };
  return data.data;
}

/** List all webhooks registered for this app. */
export async function listWebhooks(): Promise<XWebhook[]> {
  const res = await appOnlyFetch("/2/webhooks");
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to list webhooks: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { data: XWebhook[] };
  return data.data || [];
}

/** Delete a webhook by ID. */
export async function deleteWebhook(webhookId: string): Promise<void> {
  const res = await appOnlyFetch(`/2/webhooks/${webhookId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete webhook: ${res.status} ${err}`);
  }
}

/**
 * Get or create a webhook.
 * If one already exists for our URL, returns it. Otherwise creates one.
 */
export async function ensureWebhook(): Promise<{ webhookId: string; url: string }> {
  const domain = process.env.NEXT_PUBLIC_APP_URL || "";
  const webhookUrl = `${domain}/api/x/webhook`;

  const existing = await listWebhooks();
  const match = existing.find((w) => w.url === webhookUrl && w.valid);
  if (match) {
    return { webhookId: match.id, url: match.url };
  }

  const created = await registerWebhook(webhookUrl);
  return { webhookId: created.id, url: created.url };
}

// ─── Subscription Management ────────────────────────────────────────

export interface XSubscription {
  subscription_id: string;
  event_type: string;
  filter: { user_id: string };
  created_at: string;
  tag?: string;
  webhook_id?: string;
}

/** Create a subscription for a user's events. */
export async function createSubscription(
  eventType: string,
  userId: string,
  webhookId?: string
): Promise<XSubscription> {
  const body: Record<string, unknown> = {
    event_type: eventType,
    filter: { user_id: userId },
    tag: `Komet ${eventType} for ${userId}`,
  };
  if (webhookId) body.webhook_id = webhookId;

  const res = await appOnlyFetch("/2/activity/subscriptions", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create subscription: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { data: XSubscription[] };
  return data.data?.[0];
}

/** List all subscriptions for this app. */
export async function listSubscriptions(): Promise<XSubscription[]> {
  const res = await appOnlyFetch("/2/activity/subscriptions");
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to list subscriptions: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { data: XSubscription[] };
  return data.data || [];
}

/** Delete a subscription by ID. */
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  const res = await appOnlyFetch(`/2/activity/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete subscription: ${res.status} ${err}`);
  }
}

/** Create all default subscriptions for a given Twitter user. */
const DEFAULT_EVENTS = [
  "post.create",
  "post.delete",
  "follow.follow",
  "follow.unfollow",
];

export async function createUserSubscriptions(
  userId: string,
  webhookId: string
): Promise<XSubscription[]> {
  const results: XSubscription[] = [];
  for (const eventType of DEFAULT_EVENTS) {
    try {
      const sub = await createSubscription(eventType, userId, webhookId);
      results.push(sub);
      console.log(`[XAA] Created subscription: ${eventType} for user ${userId}`);
    } catch (err) {
      console.error(`[XAA] Failed subscription ${eventType} for ${userId}:`, err);
    }
  }
  return results;
}

// ─── CRC & Signature Verification ───────────────────────────────────

/** Build CRC response_token: HMAC SHA-256 of crc_token using consumer secret. */
export function buildCrcResponse(crcToken: string): string {
  const secret = getConsumerSecret();
  if (!secret) throw new Error("TWITTER_CONSUMER_SECRET is not configured");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(crcToken)
    .digest("base64");
  return `sha256=${hmac}`;
}

/** Verify that a webhook POST request actually came from X. */
export function verifySignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  const secret = getConsumerSecret();
  if (!secret) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

// ─── Event Processing ───────────────────────────────────────────────

export interface XActivityEvent {
  event_type: string;
  event_uuid: string;
  filter: { user_id: string };
  tag?: string;
  payload: Record<string, unknown>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Process an incoming XAA event — store in ActivityLog. */
export async function processEvent(event: XActivityEvent): Promise<void> {
  const { event_type, filter, payload, event_uuid } = event;
  const userId = filter.user_id;

  console.log(`[XAA] Event: ${event_type} | user: ${userId} | uuid: ${event_uuid}`);

  // Find the Twitter account in our DB
  const twitterAccount = await (prisma.socialAccount as any).findFirst({
    where: {
      platform: "twitter",
      platformAccountId: userId,
      isActive: true,
    },
    include: {
      profile: {
        include: { workspace: { select: { id: true, ownerId: true } } },
      },
    },
  });

  if (!twitterAccount) {
    console.log(`[XAA] No Komet account found for Twitter user ${userId}, skipping`);
    return;
  }

  const workspaceId = twitterAccount.profile?.workspace?.id;
  const ownerId = twitterAccount.profile?.workspace?.ownerId;

  // 1. Store in ActivityLog
  await prisma.activityLog.create({
    data: {
      userId: ownerId || null,
      workspaceId: workspaceId || null,
      action: `x_${event_type}`,
      entityType: "twitter_activity",
      entityId: event_uuid,
      metadata: {
        platformUserId: userId,
        eventType: event_type,
        eventUuid: event_uuid,
        payload,
        tag: event.tag,
      } as any,
    },
  });

  // 2. Handle specific events
  switch (event_type) {
    case "post.create": {
      // Track that a tweet was posted (could be from Komet or manually)
      await prisma.activityLog.create({
        data: {
          userId: ownerId || null,
          workspaceId: workspaceId || null,
          action: "post.created",
          entityType: "post",
          entityId: userId,
          metadata: {
            platform: "twitter",
            platformUserId: userId,
            tweetId: (payload as any).id,
            text: (payload as any).text,
          } as any,
        },
      });
      break;
    }

    case "follow.follow":
    case "follow.unfollow": {
      // Update analytics: follower count changed
      const isFollow = event_type === "follow.follow";
      // We can trigger a follower count refresh here
      console.log(`[XAA] ${isFollow ? "Follow" : "Unfollow"} event for user ${userId}`);
      break;
    }

    case "post.delete": {
      console.log(`[XAA] Post deleted by user ${userId}:`, payload);
      break;
    }

    default:
      console.log(`[XAA] Unhandled event type: ${event_type}`);
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
