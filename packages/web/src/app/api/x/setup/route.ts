// X Activity API (XAA) Setup & Subscription Management
// POST /api/x/setup — Register webhook + create subscriptions for all Twitter accounts
// GET  /api/x/subscriptions — List current subscriptions
// POST /api/x/subscriptions — Subscribe event types for a specific user

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";
import { prisma } from "@/lib/supabase-admin";
import {
  ensureWebhook,
  createUserSubscriptions,
  listSubscriptions,
  deleteSubscription,
} from "@/lib/x-activity";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── POST /api/x/setup ──────────────────────────────────────────────
// Registers webhook + creates subscriptions for all Twitter accounts.
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Ensure webhook is registered
    console.log("[XAA Setup] Ensuring webhook...");
    const { webhookId, url } = await ensureWebhook();
    console.log("[XAA Setup] Webhook ready:", webhookId, url);

    // 2. Find all connected Twitter accounts
    const twitterAccounts = await (prisma.socialAccount as any).findMany({
      where: {
        platform: "twitter",
        isActive: true,
        platformAccountId: { not: null },
      },
    });

    console.log(`[XAA Setup] Found ${twitterAccounts.length} Twitter accounts`);

    // 3. Create subscriptions for all Twitter accounts
    let created = 0;
    let skipped = 0;
    for (const acct of twitterAccounts) {
      const uid: string = acct.platformAccountId;
      const subs = await createUserSubscriptions(uid, webhookId);
      created += subs.length;
      skipped += 4 - subs.length; // 4 default events, minus created
    }

    return NextResponse.json({
      success: true,
      webhookId,
      webhookUrl: url,
      accountsFound: twitterAccounts.length,
      subscriptionsCreated: created,
      subscriptionsSkipped: skipped,
    });
  } catch (err) {
    console.error("[XAA Setup] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Setup failed",
      },
      { status: 500 }
    );
  }
}

// ─── GET /api/x/subscriptions ───────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await listSubscriptions();
    return NextResponse.json({ subscriptions });
  } catch (err) {
    console.error("[XAA List] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list subscriptions" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/x/subscriptions ────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const subscriptionId = body?.subscriptionId as string | undefined;
    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 });
    }

    await deleteSubscription(subscriptionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[XAA Delete] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
