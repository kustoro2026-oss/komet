// @komet/audit - Audit logging for security & compliance
import type { AuditAction } from "@komet/shared";

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  workspaceId?: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQuery {
  userId?: string;
  workspaceId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface AuditQueryResult {
  logs: any[];
  total: number;
  page: number;
  totalPages: number;
}

// ===== Audit Service =====
export class AuditService {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { prisma } = await import("@komet/db");
      await prisma.activityLog.create({
        data: {
          userId: entry.userId,
          workspaceId: entry.workspaceId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: (entry.metadata || {}) as any,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      console.error("[AuditService] Failed to log entry:", error);
    }
  }

  async query(query: AuditQuery): Promise<AuditQueryResult> {
    const { prisma } = await import("@komet/db");
    const where: Record<string, unknown> = {};

    if (query.userId) where.userId = query.userId;
    if (query.workspaceId) where.workspaceId = query.workspaceId;
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) (where.createdAt as any).gte = query.dateFrom;
      if (query.dateTo) (where.createdAt as any).lte = query.dateTo;
    }

    const page = query.page || 1;
    const limit = query.limit || 50;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.activityLog.count({ where: where as any }),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getRecentByUser(userId: string, limit = 20): Promise<any[]> {
    const { prisma } = await import("@komet/db");
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const auditService = new AuditService();
