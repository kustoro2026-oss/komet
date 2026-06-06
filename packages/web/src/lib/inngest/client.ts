import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "komet",
  name: "Komet",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// ===== Event Types =====
export interface PostPublishedPayload {
  postId: string;
  profileId: string;
  platform: string;
  publishedUrl?: string;
}

export interface PostScheduledPayload {
  postId: string;
  scheduledFor: string;
  profileId: string;
  platforms: string[];
}

export interface AiGenerationRequestedPayload {
  userId: string;
  prompt: string;
  tone: string;
  platform?: string;
}

export interface AccountExpiringPayload {
  accountId: string;
  platform: string;
  userId: string;
  daysUntilExpiry: number;
}

export interface AutoReplyCheckPayload {
  timestamp: string;
}

// ===== Functions =====
export const handlePostScheduled = inngest.createFunction(
  { id: "handle-post-scheduled", name: "Publish scheduled post" },
  { event: "post/scheduled" },
  async ({ event, step }) => {
    const data = event.data as unknown as PostScheduledPayload;
    const { postId } = data;

    await step.run("check-schedule", async () => {
      console.log(`[Inngest] Checking schedule for post ${postId}`);
    });

    await step.run("publish-to-platforms", async () => {
      console.log(`[Inngest] Publishing post ${postId}`);
    });

    await step.run("send-notification", async () => {
      console.log(`[Inngest] Sending notification for post ${postId}`);
    });
  }
);

export const handleAiGeneration = inngest.createFunction(
  { id: "handle-ai-generation", name: "Generate AI content" },
  { event: "ai/generation.requested" },
  async ({ event, step }) => {
    const data = event.data as unknown as AiGenerationRequestedPayload;
    const { prompt } = data;

    const content = await step.run("generate-content", async () => {
      console.log(`[Inngest] Generating AI content: ${prompt.substring(0, 50)}...`);
      return "";
    });

    await step.run("save-result", async () => {
      console.log(`[Inngest] Saving AI generated content`);
    });

    return { content };
  }
);

export const handleAccountExpiring = inngest.createFunction(
  { id: "handle-account-expiring", name: "Notify expiring account" },
  { event: "account/expiring" },
  async ({ event, step }) => {
    const data = event.data as unknown as AccountExpiringPayload;
    const { accountId, platform, daysUntilExpiry } = data;

    await step.run("send-expiry-warning", async () => {
      console.log(
        `[Inngest] Account ${accountId} (${platform}) expires in ${daysUntilExpiry} days`
      );
    });
  }
);

// ===== Cron Jobs =====
export const handleAutoReplyCheck = inngest.createFunction(
  { id: "auto-reply-check", name: "Process auto-reply rules" },
  { cron: "*/15 * * * *" },
  async ({ step }) => {
    const result = await step.run("process-auto-replies", async () => {
      const apiKey = process.env.ZERNIO_API_KEY;
      if (!apiKey) {
        return { status: "skipped", reason: "Zernio API key not configured" };
      }

      try {
        // Load server-side rules from /tmp (Vercel-compatible writable directory)
        const fs = await import("fs/promises");
        const path = await import("path");
        const rulesPath = path.join("/tmp", "auto-reply-rules.json");
        
        let serverRules: {
          id: string;
          name: string;
          trigger: { type: string; keywords?: string[] };
          reply: string;
          platforms: string[];
          source: string;
          isActive: boolean;
          createdAt: string;
        }[] = [];
        try {
          const raw = await fs.readFile(rulesPath, "utf-8");
          serverRules = JSON.parse(raw);
        } catch {
          return {
            status: "skipped",
            reason: "No server-side rules configured. Create rules via the Auto-Reply dashboard or add auto-reply-rules.json",
          };
        }

        if (!serverRules.length) {
          return { status: "skipped", reason: "No active rules to process" };
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const { ZernioClient } = await import("@komet/zernio-client");
        const client = new ZernioClient(apiKey);

        // Get connected accounts
        const accounts = await client.listAccounts().catch(() => []);
        const accountIds = accounts.map((a: { id: string }) => a.id);

        const response = await fetch(`${appUrl}/api/auto-reply/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rules: serverRules,
            accountIds,
          }),
        });

        const data = await response.json();
        return {
          status: "completed",
          repliesSent: data.totalProcessed || 0,
          log: data.log || [],
        };
      } catch (err) {
        return {
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    });

    return result;
  }
);
