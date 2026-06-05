// @komet/cache - Redis caching layer (Upstash)

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(pattern?: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ===== In-Memory Fallback Cache =====
export class MemoryCache implements CacheService {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async flush(pattern?: string): Promise<void> {
    if (pattern) {
      const regex = new RegExp(pattern.replace("*", ".*"));
      for (const key of this.store.keys()) {
        if (regex.test(key)) this.store.delete(key);
      }
    } else {
      this.store.clear();
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }
}

// ===== Upstash Redis Cache =====
export class UpstashRedisCache implements CacheService {
  private redis: any;
  private fallback: MemoryCache;

  constructor() {
    this.fallback = new MemoryCache();
  }

  private async getClient(): Promise<any> {
    if (this.redis) return this.redis;
    try {
      const { Redis } = await import("@upstash/redis");
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || "",
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
      });
      return this.redis;
    } catch {
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const client = await this.getClient();
    if (!client) return this.fallback.get<T>(key);
    try {
      return (await client.get(key)) as T | null;
    } catch {
      return this.fallback.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const client = await this.getClient();
    if (!client) return this.fallback.set(key, value, ttlSeconds);
    try {
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, value);
      } else {
        await client.set(key, value);
      }
    } catch {
      await this.fallback.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    const client = await this.getClient();
    if (!client) return this.fallback.del(key);
    try {
      await client.del(key);
    } catch {
      await this.fallback.del(key);
    }
  }

  async flush(pattern?: string): Promise<void> {
    const client = await this.getClient();
    if (!client) return this.fallback.flush(pattern);
    try {
      if (pattern) {
        let cursor = 0;
        do {
          const [nextCursor, keys] = await client.scan(cursor, { match: pattern });
          cursor = parseInt(nextCursor);
          if (keys.length > 0) await client.del(...keys);
        } while (cursor !== 0);
      } else {
        await client.flushall();
      }
    } catch {
      await this.fallback.flush(pattern);
    }
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return this.fallback.exists(key);
    try {
      return !!(await client.exists(key));
    } catch {
      return this.fallback.exists(key);
    }
  }
}

// ===== Cache Factory =====
export function createCache(): CacheService {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return new UpstashRedisCache();
  }
  return new MemoryCache();
}

export const cache = createCache();
