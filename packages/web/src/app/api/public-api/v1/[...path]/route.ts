// Public REST API v1 - Full implementation
// Route: /api/public-api/v1/{resource}?api_key=xxx
// Supports: posts, accounts, analytics, media

import { NextRequest, NextResponse } from "next/server";

// ===== Types =====
interface ApiKey {
  key: string;
  userId: string;
  name: string;
  scopes: string[];
  active: boolean;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
  };
}

// ===== API Key Store (in-memory for now, would use DB in production) =====
const API_KEYS: ApiKey[] = [
  { key: "komet_test_key", userId: "user_1", name: "Test Key", scopes: ["posts:read", "posts:write", "analytics:read", "accounts:read", "media:read"], active: true },
];

// ===== Rate Limiter (in-memory) =====
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 100; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(apiKey);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  entry.count++;
  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: entry.resetAt,
  };
}

// ===== Authentication =====
function authenticate(request: NextRequest): { authenticated: boolean; userId?: string; scopes?: string[]; error?: ErrorResponse; apiKey?: string } {
  const apiKey = request.nextUrl.searchParams.get("api_key") || request.headers.get("x-api-key");

  if (!apiKey) {
    return {
      authenticated: false,
      error: {
        success: false,
        error: { code: "MISSING_API_KEY", message: "API key is required. Provide via ?api_key= or x-api-key header.", status: 401 },
      },
    };
  }

  const keyRecord = API_KEYS.find((k) => k.key === apiKey && k.active);
  if (!keyRecord) {
    return {
      authenticated: false,
      error: {
        success: false,
        error: { code: "INVALID_API_KEY", message: "Invalid or inactive API key.", status: 403 },
      },
    };
  }

  const rateLimit = checkRateLimit(apiKey);
  if (!rateLimit.allowed) {
    return {
      authenticated: false,
      error: {
        success: false,
        error: { code: "RATE_LIMITED", message: `Rate limit exceeded. Try again after ${new Date(rateLimit.resetAt).toISOString()}.`, status: 429 },
      },
    };
  }

  return { authenticated: true, userId: keyRecord.userId, scopes: keyRecord.scopes, apiKey };
}

// ===== Mock Data =====
const MOCK_POSTS = [
  { id: "post_1", content: "Excited to announce our new feature! 🚀", platforms: ["twitter", "linkedin"], status: "published", createdAt: "2024-06-01T10:00:00Z", engagement: 1234, hashtags: ["announcement", "newfeature"] },
  { id: "post_2", content: "Behind the scenes of our latest photoshoot", platforms: ["instagram"], status: "scheduled", scheduledFor: "2024-06-10T09:00:00Z", createdAt: "2024-06-05T14:00:00Z", engagement: 0, hashtags: ["behindthescenes", "photography"] },
  { id: "post_3", content: "Weekly tech thread: AI in social media", platforms: ["twitter", "reddit"], status: "draft", createdAt: "2024-06-03T08:00:00Z", engagement: 0, hashtags: ["ai", "socialmedia", "tech"] },
];

const MOCK_ACCOUNTS = [
  { id: "acc_1", platform: "twitter", username: "komet_app", displayName: "Komet", followers: 12500, following: 420, isActive: true, connectedAt: "2024-01-15T00:00:00Z" },
  { id: "acc_2", platform: "instagram", username: "komet_app", displayName: "Komet", followers: 10200, following: 310, isActive: true, connectedAt: "2024-01-20T00:00:00Z" },
  { id: "acc_3", platform: "linkedin", username: "komet-app", displayName: "Komet Inc.", followers: 5400, following: 180, isActive: true, connectedAt: "2024-02-01T00:00:00Z" },
];

const MOCK_ANALYTICS = {
  overview: { totalPosts: 128, published: 95, scheduled: 18, drafts: 15, totalEngagement: 45200, followers: 28100 },
  byPlatform: {
    twitter: { posts: 45, engagement: 15200, followers: 12500, impressions: 89000 },
    instagram: { posts: 38, engagement: 18200, followers: 10200, impressions: 65000 },
    linkedin: { posts: 25, engagement: 6800, followers: 5400, impressions: 34000 },
  },
};

// ===== Response Helpers =====
function successResponse<T>(data: T, status = 200, pagination?: PaginatedResponse<T>["pagination"]): NextResponse {
  const body: PaginatedResponse<T> = { success: true, data };
  if (pagination) body.pagination = pagination;
  return NextResponse.json(body, { status });
}

function errorResponse(code: string, message: string, status: number): NextResponse {
  const body: ErrorResponse = { success: false, error: { code, message, status } };
  return NextResponse.json(body, { status });
}

// ===== Route Handlers =====
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const auth = authenticate(request);
  if (!auth.authenticated || !auth.userId || !auth.scopes) {
    return NextResponse.json(auth.error, { status: auth.error!.error.status });
  }

  const resource = path[0] || "";
  const id = path[1];
  const searchParams = request.nextUrl.searchParams;

  switch (resource) {
    case "posts": {
      if (!auth.scopes.includes("posts:read")) return errorResponse("FORBIDDEN", "Scope 'posts:read' required.", 403);
      if (id) {
        const post = MOCK_POSTS.find((p) => p.id === id);
        return post ? successResponse(post) : errorResponse("NOT_FOUND", "Post not found.", 404);
      }
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const status = searchParams.get("status");
      let filtered = MOCK_POSTS;
      if (status && status !== "all") filtered = filtered.filter((p) => p.status === status);
      return successResponse(filtered.slice((page - 1) * limit, page * limit), 200, {
        page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit),
      });
    }

    case "accounts": {
      if (!auth.scopes.includes("accounts:read")) return errorResponse("FORBIDDEN", "Scope 'accounts:read' required.", 403);
      if (id) {
        const account = MOCK_ACCOUNTS.find((a) => a.id === id);
        return account ? successResponse(account) : errorResponse("NOT_FOUND", "Account not found.", 404);
      }
      return successResponse(MOCK_ACCOUNTS);
    }

    case "analytics": {
      if (!auth.scopes.includes("analytics:read")) return errorResponse("FORBIDDEN", "Scope 'analytics:read' required.", 403);
      const platform = searchParams.get("platform");
      if (platform) {
        const data = (MOCK_ANALYTICS.byPlatform as Record<string, unknown>)[platform];
        return data ? successResponse(data) : errorResponse("NOT_FOUND", `No analytics for platform: ${platform}`, 404);
      }
      return successResponse(MOCK_ANALYTICS.overview);
    }

    case "media": {
      if (!auth.scopes.includes("media:read")) return errorResponse("FORBIDDEN", "Scope 'media:read' required.", 403);
      return successResponse([]);
    }

    default:
      return errorResponse("NOT_FOUND", `Unknown resource: ${resource}. Available: posts, accounts, analytics, media`, 404);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const auth = authenticate(request);
  if (!auth.authenticated || !auth.userId || !auth.scopes) {
    return NextResponse.json(auth.error, { status: auth.error!.error.status });
  }

  const resource = path[0] || "";

  switch (resource) {
    case "posts": {
      if (!auth.scopes.includes("posts:write")) return errorResponse("FORBIDDEN", "Scope 'posts:write' required.", 403);
      try {
        const body = await request.json();
        if (!body.content || !body.platforms) {
          return errorResponse("VALIDATION_ERROR", "'content' and 'platforms' are required.", 400);
        }
        const newPost = {
          id: `post_${Date.now()}`,
          content: body.content,
          platforms: body.platforms,
          status: "draft",
          hashtags: body.hashtags || [],
          createdAt: new Date().toISOString(),
          engagement: 0,
        };
        return successResponse(newPost, 201);
      } catch {
        return errorResponse("INVALID_JSON", "Invalid JSON body.", 400);
      }
    }

    case "analytics/refresh": {
      if (!auth.scopes.includes("analytics:read")) return errorResponse("FORBIDDEN", "Scope 'analytics:read' required.", 403);
      return successResponse({ message: "Analytics refresh initiated.", refreshId: `refresh_${Date.now()}` });
    }

    default:
      return errorResponse("NOT_FOUND", `Cannot POST to resource: ${resource}`, 404);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const auth = authenticate(request);
  if (!auth.authenticated || !auth.userId || !auth.scopes) {
    return NextResponse.json(auth.error, { status: auth.error!.error.status });
  }

  const resource = path[0] || "";
  const id = path[1];

  switch (resource) {
    case "posts": {
      if (!auth.scopes.includes("posts:write")) return errorResponse("FORBIDDEN", "Scope 'posts:write' required.", 403);
      if (!id) return errorResponse("MISSING_ID", "Post ID required in path: /api/public-api/v1/posts/{id}", 400);
      const post = MOCK_POSTS.find((p) => p.id === id);
      if (!post) return errorResponse("NOT_FOUND", "Post not found.", 404);
      return successResponse({ ...post, status: "updated" });
    }

    default:
      return errorResponse("NOT_FOUND", `Cannot PUT to resource: ${resource}`, 404);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const auth = authenticate(request);
  if (!auth.authenticated || !auth.userId || !auth.scopes) {
    return NextResponse.json(auth.error, { status: auth.error!.error.status });
  }

  const resource = path[0] || "";
  const id = path[1];

  switch (resource) {
    case "posts": {
      if (!auth.scopes.includes("posts:write")) return errorResponse("FORBIDDEN", "Scope 'posts:write' required.", 403);
      if (!id) return errorResponse("MISSING_ID", "Post ID required.", 400);
      return successResponse({ message: `Post ${id} deleted.` });
    }

    default:
      return errorResponse("NOT_FOUND", `Cannot DELETE resource: ${resource}`, 404);
  }
}
