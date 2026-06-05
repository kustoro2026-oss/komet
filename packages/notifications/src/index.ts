// @komet/notifications - Notification delivery system
import type { NotificationType } from "@komet/shared";

export interface NotificationPayload {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string;
}

// ===== Channel Interfaces =====
export interface NotificationChannel {
  readonly name: string;
  send(notification: NotificationPayload): Promise<boolean>;
}

// ===== In-App Channel =====
export class InAppChannel implements NotificationChannel {
  readonly name = "in-app";

  async send(notification: NotificationPayload): Promise<boolean> {
    try {
      const { prisma } = await import("@komet/db");
      await prisma.notification.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: (notification.data || {}) as any,
          link: notification.link,
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}

// ===== Push Channel =====
export class PushChannel implements NotificationChannel {
  readonly name = "push";

  async send(notification: NotificationPayload): Promise<boolean> {
    try {
      // Web Push API implementation placeholder
      console.log(`[Push] Would send to user ${notification.userId}: ${notification.title}`);
      return true;
    } catch {
      return false;
    }
  }
}

// ===== Email Channel =====
export class EmailChannel implements NotificationChannel {
  readonly name = "email";

  async send(notification: NotificationPayload): Promise<boolean> {
    try {
      // Email sending via Resend/SendGrid placeholder
      console.log(`[Email] Would send to user ${notification.userId}: ${notification.title}`);
      return true;
    } catch {
      return false;
    }
  }
}

// ===== Notification Service =====
export class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map();

  constructor() {
    this.registerChannel(new InAppChannel());
    this.registerChannel(new EmailChannel());
    this.registerChannel(new PushChannel());
  }

  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
  }

  async send(notification: NotificationPayload, channels?: string[]): Promise<Record<string, boolean>> {
    const targetChannels = channels || ["in-app"];
    const results: Record<string, boolean> = {};

    for (const channelName of targetChannels) {
      const channel = this.channels.get(channelName);
      if (channel) {
        results[channelName] = await channel.send(notification);
      }
    }

    return results;
  }

  async markRead(notificationId: string): Promise<void> {
    const { prisma } = await import("@komet/db");
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    const { prisma } = await import("@komet/db");
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { prisma } = await import("@komet/db");
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async list(userId: string, options?: { limit?: number; offset?: number; type?: string; unreadOnly?: boolean }): Promise<{ notifications: any[]; total: number }> {
    const { prisma } = await import("@komet/db");
    const where: Record<string, unknown> = { userId };
    if (options?.type) where.type = options.type;
    if (options?.unreadOnly) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
    const total = await prisma.notification.count({ where: where as any });
    return { notifications, total };
  }
}

export const notificationService = new NotificationService();
