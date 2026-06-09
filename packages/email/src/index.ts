// @komet/email - Email templates & sending engine
import React from "react";

export type EmailType = "post_failed" | "weekly_digest" | "team_invite" | "payment_receipt" | "account_expiring" | "scheduled_reminder";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailTemplate<T = Record<string, unknown>> {
  type: EmailType;
  subject(data: T): string;
  render(data: T): string;
}

// ===== Template Components =====
export function PostFailedAlert({ postContent, platform, error }: { postContent: string; platform: string; error: string }) {
  return React.createElement("div", null,
    React.createElement("h2", null, "Post Failed to Publish"),
    React.createElement("p", null, `Your post on ${platform} failed:`),
    React.createElement("blockquote", null, postContent),
    React.createElement("p", { style: { color: "red" } }, `Error: ${error}`),
    React.createElement("a", { href: "#" }, "View details"),
  );
}

export function WeeklyDigest({ postsPublished, engagement, followers, topPlatform }: { postsPublished: number; engagement: string; followers: number; topPlatform: string }) {
  return React.createElement("div", null,
    React.createElement("h2", null, "Your Weekly Performance Digest"),
    React.createElement("ul", null,
      React.createElement("li", null, `Posts published: ${postsPublished}`),
      React.createElement("li", null, `Engagement: ${engagement}`),
      React.createElement("li", null, `New followers: ${followers}`),
      React.createElement("li", null, `Top platform: ${topPlatform}`),
    ),
  );
}

export function TeamInvite({ workspaceName, inviterName, inviteLink }: { workspaceName: string; inviterName: string; inviteLink: string }) {
  return React.createElement("div", null,
    React.createElement("h2", null, `You're invited to ${workspaceName}`),
    React.createElement("p", null, `${inviterName} has invited you to join their workspace on Komet.`),
    React.createElement("a", { href: inviteLink, style: { background: "#6366F1", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none" } }, "Accept Invite"),
  );
}

export function PaymentReceipt({ plan, amount, date }: { plan: string; amount: string; date: string }) {
  return React.createElement("div", null,
    React.createElement("h2", null, "Payment Receipt"),
    React.createElement("p", null, `Plan: ${plan}`),
    React.createElement("p", null, `Amount: ${amount}`),
    React.createElement("p", null, `Date: ${date}`),
  );
}

export function AccountExpiring({ platform, username, daysLeft }: { platform: string; username: string; daysLeft: number }) {
  return React.createElement("div", null,
    React.createElement("h2", null, "Account Token Expiring Soon"),
    React.createElement("p", null, `Your ${platform} account (${username}) token will expire in ${daysLeft} days.`),
    React.createElement("a", { href: "/accounts" }, "Reconnect now"),
  );
}

// ===== Template Registry =====
const templates: Record<EmailType, EmailTemplate<any>> = {
  post_failed: {
    type: "post_failed",
    subject: (data: any) => `[Komet] Post failed on ${data.platform}`,
    render: (data: any) => `<div><h2>Post Failed to Publish</h2><p>Your post on ${data.platform} failed:</p><blockquote>${data.postContent}</blockquote><p style="color:red">Error: ${data.error}</p><a href="#">View details</a></div>`,
  },
  weekly_digest: {
    type: "weekly_digest",
    subject: () => "[Komet] Weekly Performance Digest",
    render: (data: any) => `<div><h2>Your Weekly Performance Digest</h2><ul><li>Posts published: ${data.postsPublished}</li><li>Engagement: ${data.engagement}</li><li>New followers: ${data.followers}</li><li>Top platform: ${data.topPlatform}</li></ul></div>`,
  },
  team_invite: {
    type: "team_invite",
    subject: (data: any) => `[Komet] You're invited to ${data.workspaceName}`,
    render: (data: any) => `<div><h2>You're invited to ${data.workspaceName}</h2><p>${data.inviterName} has invited you to join their workspace on Komet.</p><a href="${data.inviteLink}" style="background:#6366F1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Accept Invite</a></div>`,
  },
  payment_receipt: {
    type: "payment_receipt",
    subject: (data: any) => `[Komet] Invoice for ${data.plan} Plan`,
    render: (data: any) => `<div><h2>Payment Receipt</h2><p>Plan: ${data.plan}</p><p>Amount: ${data.amount}</p><p>Date: ${data.date}</p></div>`,
  },
  account_expiring: {
    type: "account_expiring",
    subject: (data: any) => `[Komet] ${data.platform} token expiring soon`,
    render: (data: any) => `<div><h2>Account Token Expiring Soon</h2><p>Your ${data.platform} account (${data.username}) token will expire in ${data.daysLeft} days.</p><a href="/accounts">Reconnect now</a></div>`,
  },
  scheduled_reminder: {
    type: "scheduled_reminder",
    subject: () => "[Komet] Scheduled post in 30 minutes",
    render: (data: any) => `<div><h2>Post Scheduled Reminder</h2><p>Your post "${data.content}" is scheduled in 30 minutes on ${data.platforms}.</p></div>`,
  },
};

// ===== Email Service =====
export class EmailService {
  /** Read API key fresh every call — avoids stale value from module import cache */
  private getApiKey(): string {
    return process.env.RESEND_API_KEY || "";
  }

  getTemplate(type: EmailType): EmailTemplate | undefined {
    return templates[type];
  }

  renderTemplate(type: EmailType, data: Record<string, unknown>): string {
    const template = templates[type];
    if (!template) throw new Error(`Unknown email template: ${type}`);
    return template.render(data);
  }

  getSubject(type: EmailType, data: Record<string, unknown>): string {
    const template = templates[type];
    if (!template) throw new Error(`Unknown email template: ${type}`);
    return template.subject(data);
  }

  async send(payload: EmailPayload): Promise<boolean> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set in environment variables");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from || "Komet <team@komet.so>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend API error ${res.status}: ${errBody}`);
    }

    console.log(`[EmailService] Sent to ${payload.to}: ${payload.subject}`);
    return true;
  }

  async sendTemplate(type: EmailType, to: string, data: Record<string, unknown>): Promise<boolean> {
    const html = this.renderTemplate(type, data);
    const subject = this.getSubject(type, data);
    return this.send({ to, subject, html });
  }
}

export const emailService = new EmailService();
