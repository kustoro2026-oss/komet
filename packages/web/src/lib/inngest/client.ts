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
