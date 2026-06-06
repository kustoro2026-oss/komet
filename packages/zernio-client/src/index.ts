import type {
  Platform,
  ZernioProfile,
  ZernioSocialAccount,
  ZernioPost,
  ZernioOAuthStart,
  ZernioAnalytics,
  ZernioMediaUploadResult,
  ZernioWebhook,
  ZernioPagination,
} from "@komet/shared";

export type ZernioErrorCode =
  | "free_tier_exceeded"
  | "twitter_passthrough"
  | "enterprise_required"
  | "rate_limited";

export class ZernioError extends Error {
  constructor(
    public status: number,
    public code?: ZernioErrorCode,
    message?: string
  ) {
    super(message || `Zernio API error: ${status}`);
    this.name = "ZernioError";
  }

  get isPaymentRequired(): boolean {
    return this.status === 402;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

interface ZernioRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  retries?: number;
}

export class ZernioClient {
  private baseUrl = "https://zernio.com/api/v1";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("Zernio API key is required");
    this.apiKey = apiKey;
  }

  private async request<T>(
    path: string,
    options: ZernioRequestOptions = {}
  ): Promise<T> {
    const { method = "GET", body, params, retries = 0 } = options;

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.set(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const fetchOptions: RequestInit = { method, headers };
    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (response.status === 429 && retries < 3) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retries) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      return this.request<T>(path, { ...options, retries: retries + 1 });
    }

    if (!response.ok) {
      let errorData: { code?: ZernioErrorCode; message?: string } | undefined;
      try {
        errorData = await response.json();
      } catch {}
      throw new ZernioError(
        response.status,
        errorData?.code,
        errorData?.message
      );
    }

    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }

  // ===== PROFILES =====
  async listProfiles(): Promise<ZernioProfile[]> {
    return this.request<ZernioProfile[]>("/profiles");
  }

  async createProfile(
    name: string,
    description?: string,
    color?: string
  ): Promise<ZernioProfile> {
    return this.request<ZernioProfile>("/profiles", {
      method: "POST",
      body: { name, description, color },
    });
  }

  async getProfile(profileId: string): Promise<ZernioProfile> {
    return this.request<ZernioProfile>(`/profiles/${profileId}`);
  }

  async updateProfile(
    profileId: string,
    data: Partial<ZernioProfile>
  ): Promise<ZernioProfile> {
    return this.request<ZernioProfile>(`/profiles/${profileId}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteProfile(profileId: string): Promise<void> {
    return this.request<void>(`/profiles/${profileId}`, { method: "DELETE" });
  }

  // ===== SOCIAL ACCOUNTS =====
  async listAccounts(profileId?: string): Promise<ZernioSocialAccount[]> {
    return this.request<ZernioSocialAccount[]>("/accounts", {
      params: { profileId },
    });
  }

  async updateAccount(
    accountId: string,
    data: Partial<ZernioSocialAccount>
  ): Promise<ZernioSocialAccount> {
    return this.request<ZernioSocialAccount>(`/accounts/${accountId}`, {
      method: "PUT",
      body: data,
    });
  }

  async disconnectAccount(accountId: string): Promise<void> {
    return this.request<void>(`/accounts/${accountId}`, { method: "DELETE" });
  }

  // ===== OAUTH =====
  async startOAuth(
    platform: string,
    profileId: string,
    redirectUrl?: string
  ): Promise<ZernioOAuthStart> {
    return this.request<ZernioOAuthStart>(`/connect/${platform}`, {
      params: { profileId, redirect_url: redirectUrl },
    });
  }

  async completeOAuth(
    platform: string,
    code: string,
    state: string,
    profileId: string
  ): Promise<ZernioSocialAccount> {
    return this.request<ZernioSocialAccount>(`/connect/${platform}`, {
      method: "POST",
      body: { code, state, profileId },
    });
  }

  async connectBluesky(
    identifier: string,
    appPassword: string,
    profileId: string
  ): Promise<ZernioSocialAccount> {
    return this.request<ZernioSocialAccount>("/connect/bluesky", {
      method: "POST",
      body: { identifier, appPassword, profileId },
    });
  }

  async selectFacebookPage(
    profileId: string,
    pageId: string,
    tempToken: string
  ): Promise<ZernioSocialAccount> {
    return this.request<ZernioSocialAccount>(
      "/connect/facebook/select-page",
      {
        method: "POST",
        body: { profileId, pageId, tempToken },
      }
    );
  }

  async selectLinkedInOrganization(
    profileId: string,
    tempToken: string,
    accountType: string,
    selectedOrg?: string
  ): Promise<ZernioSocialAccount> {
    return this.request<ZernioSocialAccount>(
      "/connect/linkedin/select-organization",
      {
        method: "POST",
        body: { profileId, tempToken, accountType, selectedOrg },
      }
    );
  }

  async selectPinterestBoard(
    profileId: string,
    boardId: string,
    boardName: string,
    tempToken: string
  ): Promise<ZernioSocialAccount> {
    return this.request<ZernioSocialAccount>(
      "/connect/pinterest/select-board",
      {
        method: "POST",
        body: { profileId, boardId, boardName, tempToken },
      }
    );
  }

  // ===== POSTS =====
  async listPosts(params?: {
    status?: string;
    profileId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: ZernioPost[]; pagination: ZernioPagination }> {
    return this.request("/posts", { params: params as Record<string, string | number | boolean | undefined> });
  }

  async createPost(data: {
    content: string;
    title?: string;
    platforms: { platform: string; accountId: string }[];
    scheduledFor?: string;
    timezone?: string;
    publishNow?: boolean;
    mediaItems?: { type: "image" | "video"; url: string; title?: string }[];
    hashtags?: string[];
    tags?: string[];
  }): Promise<ZernioPost> {
    return this.request<ZernioPost>("/posts", {
      method: "POST",
      body: data,
    });
  }

  async getPost(postId: string): Promise<ZernioPost> {
    return this.request<ZernioPost>(`/posts/${postId}`);
  }

  async updatePost(
    postId: string,
    data: Partial<ZernioPost>
  ): Promise<ZernioPost> {
    return this.request<ZernioPost>(`/posts/${postId}`, {
      method: "PUT",
      body: data,
    });
  }

  async deletePost(postId: string): Promise<void> {
    return this.request<void>(`/posts/${postId}`, { method: "DELETE" });
  }

  async retryPost(postId: string): Promise<ZernioPost> {
    return this.request<ZernioPost>(`/posts/${postId}/retry`, {
      method: "POST",
    });
  }

  async bulkUpload(
    file: File,
    dryRun?: boolean
  ): Promise<{ results: { row: number; status: string; error?: string }[] }> {
    const formData = new FormData();
    formData.append("file", file);
    if (dryRun) formData.append("dryRun", "true");

    const response = await fetch(`${this.baseUrl}/posts/bulk`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new ZernioError(response.status, err.code, err.message);
    }

    return response.json();
  }

  // ===== MEDIA =====
  async getPresignedUrl(
    filename: string,
    contentType: string,
    size?: number
  ): Promise<ZernioMediaUploadResult> {
    // POST /media/presign per Zernio docs: https://docs.zernio.com/media/get-media-presigned-url
    return this.request<ZernioMediaUploadResult>("/media/presign", {
      method: "POST",
      body: { filename, contentType, size },
    });
  }

  async uploadFile(file: File): Promise<ZernioMediaUploadResult> {
    const presigned = await this.getPresignedUrl(file.name, file.type);

    await fetch(presigned.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    return presigned;
  }

  // ===== ANALYTICS =====
  async getPostAnalytics(
    postId: string,
    platform?: string
  ): Promise<ZernioAnalytics> {
    return this.request<ZernioAnalytics>(`/analytics/posts/${postId}`, {
      params: { platform },
    });
  }

  async getAccountAnalytics(
    accountId: string,
    platform: string,
    dateRange?: { from: string; to: string }
  ): Promise<ZernioAnalytics> {
    return this.request<ZernioAnalytics>(`/analytics/accounts/${accountId}`, {
      params: { platform, dateFrom: dateRange?.from, dateTo: dateRange?.to },
    });
  }

  async getFacebookAnalytics(
    accountId: string,
    params?: Record<string, string>
  ): Promise<ZernioAnalytics> {
    return this.request<ZernioAnalytics>(
      `/analytics/facebook/${accountId}`,
      { params }
    );
  }

  async getInstagramAnalytics(
    accountId: string,
    params?: Record<string, string>
  ): Promise<ZernioAnalytics> {
    return this.request<ZernioAnalytics>(
      `/analytics/instagram/${accountId}`,
      { params }
    );
  }

  // ===== COMMENTS & INBOX =====
  async listInboxPosts(params?: {
    platform?: string;
    accountId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: any[]; pagination: ZernioPagination }> {
    return this.request("/inbox/posts", { params: params as any });
  }

  async listInboxComments(postId: string, params?: { accountId?: string; page?: number; limit?: number }): Promise<{ comments: any[]; pagination: ZernioPagination }> {
    return this.request(`/inbox/comments/${postId}`, { params: params as any });
  }

  async replyToInboxComment(postId: string, accountId: string, commentId: string, message: string): Promise<void> {
    return this.request(`/inbox/comments/${postId}`, { method: "POST", body: { accountId, commentId, message } });
  }

  async hideInboxComment(postId: string, commentId: string, accountId: string): Promise<void> {
    return this.request(`/inbox/comments/${postId}/${commentId}/hide`, { method: "POST", body: { accountId } });
  }

  async listComments(params?: {
    platform?: string;
    postId?: string;
    page?: number;
  }): Promise<{ comments: any[]; pagination: ZernioPagination }> {
    return this.request("/comments", {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async replyToComment(
    commentId: string,
    text: string
  ): Promise<void> {
    return this.request<void>(`/comments/${commentId}/reply`, {
      method: "POST",
      body: { text },
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    return this.request<void>(`/comments/${commentId}`, { method: "DELETE" });
  }

  // ===== QUEUE =====
  async createQueueSlot(data: {
    profileId: string;
    accountIds: string[];
    dayOfWeek: number;
    time: string;
    timezone: string;
  }): Promise<any> {
    return this.request("/queue/slots", { method: "POST", body: data });
  }

  async listQueueSlots(profileId: string): Promise<any[]> {
    return this.request<any[]>("/queue/slots", { params: { profileId } });
  }

  async deleteQueueSlot(slotId: string): Promise<void> {
    return this.request<void>(`/queue/slots/${slotId}`, { method: "DELETE" });
  }

  // ===== WEBHOOKS (docs.zernio.com/webhooks) =====

  /** GET /v1/webhooks/settings — List all webhooks (max 10) */
  async getWebhookSettings(): Promise<{
    webhooks: ZernioWebhook[];
  }> {
    return this.request("/webhooks/settings");
  }

  /** POST /v1/webhooks/settings — Create a new webhook */
  async createWebhookSettings(data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
    isActive?: boolean;
    customHeaders?: Record<string, string>;
  }): Promise<{ success: boolean; webhook: ZernioWebhook }> {
    return this.request("/webhooks/settings", { method: "POST", body: data });
  }

  /** PUT /v1/webhooks/settings — Update an existing webhook */
  async updateWebhookSettings(
    webhookId: string,
    data: {
      name?: string;
      url?: string;
      events?: string[];
      secret?: string;
      isActive?: boolean;
      customHeaders?: Record<string, string>;
    }
  ): Promise<{ success: boolean; webhook: ZernioWebhook }> {
    return this.request("/webhooks/settings", {
      method: "PUT",
      body: { webhookId, ...data },
    });
  }

  /** DELETE /v1/webhooks/settings — Delete a webhook */
  async deleteWebhookSettings(webhookId: string): Promise<{ success: boolean }> {
    return this.request("/webhooks/settings", {
      method: "DELETE",
      body: { webhookId },
    });
  }

  /** POST /v1/webhooks/test — Send a test webhook event */
  async testWebhook(
    webhookId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/webhooks/test", {
      method: "POST",
      body: { webhookId },
    });
  }

  // ===== USAGE =====
  async getUsageStats(): Promise<{
    postsThisMonth: number;
    postLimit: number;
    connectedAccounts: number;
    accountLimit: number;
  }> {
    return this.request("/usage");
  }

  // ===== VALIDATION =====
  async validatePost(data: {
    content: string;
    platforms: string[];
  }): Promise<{ valid: boolean; errors: { platform: string; error: string }[] }> {
    return this.request("/validate/post", {
      method: "POST",
      body: data,
    });
  }
}
