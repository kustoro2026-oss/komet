// @komet/feature-flags - Feature flag manager

export interface FlagRule {
  field: string;
  operator: "eq" | "neq" | "in" | "contains" | "gte" | "lte";
  value: unknown;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FlagContext {
  userId?: string;
  workspaceId?: string;
  plan?: string;
  email?: string;
  [key: string]: unknown;
}

// ===== Feature Flag Service =====
export class FeatureFlagService {
  private cache = new Map<string, FeatureFlag>();

  async getAll(): Promise<FeatureFlag[]> {
    try {
      const { prisma } = await import("@komet/db");
      const flags = await prisma.featureFlag.findMany({ orderBy: { createdAt: "desc" } });
      return flags.map((f: any) => ({
        id: f.id,
        key: f.key,
        name: f.name,
        description: f.description || undefined,
        enabled: f.enabled,
        rules: (f.rules || {}) as Record<string, unknown>,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      }));
    } catch {
      return Array.from(this.cache.values());
    }
  }

  async isEnabled(key: string, context?: FlagContext): Promise<boolean> {
    try {
      const { prisma } = await import("@komet/db");
      const flag = await prisma.featureFlag.findUnique({ where: { key } });
      if (!flag) return false;

      if (!flag.enabled) return false;

      // Evaluate rules if present
      const rules = (flag.rules || {}) as Record<string, any>;
      if (rules.plan && context?.plan) {
        return rules.plan === context.plan || (Array.isArray(rules.plan) && rules.plan.includes(context.plan));
      }

      return flag.enabled;
    } catch {
      const cached = this.cache.get(key);
      return cached?.enabled || false;
    }
  }

  async setFlag(key: string, enabled: boolean): Promise<FeatureFlag> {
    const { prisma } = await import("@komet/db");
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: { enabled },
      create: { key, name: key, enabled },
    });
    this.cache.set(key, {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description || undefined,
      enabled: flag.enabled,
      rules: (flag.rules || {}) as Record<string, unknown>,
      createdAt: flag.createdAt.toISOString(),
      updatedAt: flag.updatedAt.toISOString(),
    });
    return this.cache.get(key)!;
  }

  async updateFlag(key: string, data: Partial<Omit<FeatureFlag, "id" | "key" | "createdAt">>): Promise<FeatureFlag> {
    const { prisma } = await import("@komet/db");
    const flag = await prisma.featureFlag.update({
      where: { key },
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        rules: data.rules as any,
      },
    });
    return {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description || undefined,
      enabled: flag.enabled,
      rules: (flag.rules || {}) as Record<string, unknown>,
      createdAt: flag.createdAt.toISOString(),
      updatedAt: flag.updatedAt.toISOString(),
    };
  }

  async deleteFlag(key: string): Promise<void> {
    const { prisma } = await import("@komet/db");
    await prisma.featureFlag.delete({ where: { key } });
    this.cache.delete(key);
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    try {
      const { prisma } = await import("@komet/db");
      const flag = await prisma.featureFlag.findUnique({ where: { key } });
      if (!flag) return null;
      return {
        id: flag.id,
        key: flag.key,
        name: flag.name,
        description: flag.description || undefined,
        enabled: flag.enabled,
        rules: (flag.rules || {}) as Record<string, unknown>,
        createdAt: flag.createdAt.toISOString(),
        updatedAt: flag.updatedAt.toISOString(),
      };
    } catch {
      return this.cache.get(key) || null;
    }
  }
}

export const featureFlagService = new FeatureFlagService();
