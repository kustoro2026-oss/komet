import { createHash } from "crypto";

// OAuth Configuration for all social media platforms
// Each platform defines: auth endpoint, token endpoint, scopes, and env var names

export interface OAuthConfig {
  /** Platform identifier (matches Prisma platform field) */
  platform: string;
  /** Display name */
  label: string;
  /** OAuth 2.0 authorization endpoint */
  authorizeUrl: string;
  /** OAuth 2.0 token exchange endpoint */
  tokenUrl: string;
  /** Profile/user info API endpoint */
  profileUrl: string;
  /** OAuth scopes required */
  scopes: string[];
  /** Authorization header type for token exchange */
  tokenAuth: "header" | "body" | "basic";
  /** Env var name for Client ID */
  clientIdEnv: string;
  /** Env var name for Client Secret */
  clientSecretEnv: string;
  /** Whether to use PKCE (code_challenge) */
  usePkce: boolean;
  /** Redirect URI path (relative to app URL) */
  redirectPath: string;
  /** Extra query params for authorize URL */
  extraAuthorizeParams?: Record<string, string>;
  /** Content type for token exchange */
  tokenContentType?: "json" | "form";
  /** Transform token response to standardized format */
  transformToken?: (raw: Record<string, unknown>) => {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  };
  /** Fetch profile from platform API using access token */
  fetchProfile: (
    accessToken: string,
    tokenResponse?: Record<string, unknown>
  ) => Promise<{
    platformAccountId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    followers?: number;
  }>;
}

function getEnv(name: string): string {
  return process.env[name] || "";
}

// ===== OAuth Config Registry =====

const configs: Record<string, OAuthConfig> = {};

function register(config: OAuthConfig) {
  configs[config.platform] = config;
}

// ──────────────────────────────────────────
// 1. Twitter / X — OAuth 2.0 with PKCE
// ──────────────────────────────────────────
register({
  platform: "twitter",
  label: "Twitter / X",
  authorizeUrl: "https://x.com/i/oauth2/authorize",
  tokenUrl: "https://api.x.com/2/oauth2/token",
  profileUrl: "https://api.x.com/2/users/me",
  scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  tokenAuth: "basic",
  clientIdEnv: "TWITTER_CLIENT_ID",
  clientSecretEnv: "TWITTER_CLIENT_SECRET",
  usePkce: true,
  redirectPath: "/api/oauth/callback",
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch("https://api.x.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as { data?: { id: string; name: string; username: string } };
    const u = data.data!;
    return {
      platformAccountId: u.id,
      username: u.username,
      displayName: u.name,
    };
  },
});

// ──────────────────────────────────────────
// 2. Instagram — OAuth 2.0 (Instagram Login / Instagram Platform API)
// Uses Instagram Direct Login (standalone, no Facebook required)
// Requires Instagram Professional (Business/Creator) account
// ──────────────────────────────────────────
register({
  platform: "instagram",
  label: "Instagram",
  authorizeUrl: "https://www.instagram.com/oauth/authorize",
  tokenUrl: "https://api.instagram.com/oauth/access_token",
  profileUrl: "https://graph.instagram.com/me",
  scopes: ["instagram_business_basic", "instagram_business_content_publish", "instagram_business_manage_comments"],
  tokenAuth: "body",
  clientIdEnv: "INSTAGRAM_CLIENT_ID",
  clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
    );
    const data = (await res.json()) as {
      id: string;
      username?: string;
      name?: string;
      profile_picture_url?: string;
    };
    return {
      platformAccountId: data.id,
      username: data.username || data.name?.toLowerCase().replace(/\s+/g, "_") || "",
      displayName: data.name || data.username || "",
      avatarUrl: data.profile_picture_url,
    };
  },
});

// ──────────────────────────────────────────
// 3. Facebook — OAuth 2.0 (Meta / Facebook Login)
// ──────────────────────────────────────────
register({
  platform: "facebook",
  label: "Facebook",
  authorizeUrl: "https://www.facebook.com/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
  profileUrl: "https://graph.facebook.com/v19.0/me",
  scopes: ["public_profile"],
  tokenAuth: "body",
  clientIdEnv: "FACEBOOK_CLIENT_ID",
  clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { response_type: "code" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,picture.type(large)&access_token=${accessToken}`
    );
    const data = (await res.json()) as {
      id: string;
      name: string;
      picture?: { data?: { url?: string } };
    };
    return {
      platformAccountId: data.id,
      username: data.name.toLowerCase().replace(/\s+/g, "."),
      displayName: data.name,
      avatarUrl: data.picture?.data?.url,
    };
  },
});

// ──────────────────────────────────────────
// 5. YouTube — OAuth 2.0 (Google)
// ──────────────────────────────────────────
register({
  platform: "youtube",
  label: "YouTube",
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  profileUrl: "https://youtube.googleapis.com/youtube/v3/channels",
  scopes: ["https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
  tokenAuth: "body",
  clientIdEnv: "YOUTUBE_CLIENT_ID",
  clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { access_type: "offline", prompt: "consent" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch(
      `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = (await res.json()) as {
      items?: { id: string; snippet?: { title: string; customUrl?: string; thumbnails?: { default?: { url?: string } } } }[];
    };
    const item = data.items?.[0] || { id: "", snippet: { title: "", customUrl: "", thumbnails: {} } };
    const title = item.snippet?.title || "";
    return {
      platformAccountId: item.id,
      username: item.snippet?.customUrl || title.toLowerCase().replace(/\s+/g, ""),
      displayName: title,
      avatarUrl: item.snippet?.thumbnails?.default?.url,
    };
  },
});

// ──────────────────────────────────────────
// 6. Threads — OAuth 2.0 (Meta / Threads API)
// ──────────────────────────────────────────
register({
  platform: "threads",
  label: "Threads",
  authorizeUrl: "https://threads.net/oauth/authorize",
  tokenUrl: "https://graph.threads.net/oauth/access_token",
  profileUrl: "https://graph.threads.net/v1.0/me",
  scopes: ["threads_basic", "threads_content_publish", "threads_read_replies"],
  tokenAuth: "body",
  clientIdEnv: "THREADS_CLIENT_ID",
  clientSecretEnv: "THREADS_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { response_type: "code" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,name,username,profile_pic&access_token=${accessToken}`
    );
    const data = (await res.json()) as {
      id: string;
      name: string;
      username?: string;
      profile_pic?: string;
    };
    return {
      platformAccountId: data.id,
      username: data.username || data.name.toLowerCase().replace(/\s+/g, "_"),
      displayName: data.name,
      avatarUrl: data.profile_pic,
    };
  },
});

// ──────────────────────────────────────────
// 7. TikTok — OAuth 2.0
// ──────────────────────────────────────────
register({
platform: "tiktok",
label: "TikTok",
authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
profileUrl: "https://open.tiktokapis.com/v2/user/info/",
scopes: ["user.info.basic", "user.info.profile", "user.info.stats", "video.list", "video.publish", "video.upload"],
tokenAuth: "body",
clientIdEnv: "TIKTOK_CLIENT_ID",
clientSecretEnv: "TIKTOK_CLIENT_SECRET",
usePkce: false,
redirectPath: "/api/oauth/callback",
extraAuthorizeParams: { prompt: "consent" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken, tokenResponse) => {
    const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url,follower_count", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const raw = await res.text();
    const data = JSON.parse(raw) as {
      data?: { user?: { display_name?: string; username?: string; avatar_url?: string; follower_count?: number | string } };
      error?: { code: string; message?: string };
    };
    if (data.error && data.error.code !== "ok") {
      console.error("[TikTok Profile] API error:", JSON.stringify(data.error));
      // Throw so the account is NOT saved with garbage data
      throw new Error(`TikTok profile fetch failed: ${data.error.code} — ${data.error.message || "Did you check ALL permissions? Try disconnecting and connecting again."}`);
    }
    // Token response always has open_id even if profile fetch fails above
    const u = data.data?.user || {};
    const followers = typeof u.follower_count === "string" ? parseInt(u.follower_count, 10) : (u.follower_count || 0);
    console.log("[TikTok Profile] raw user data:", JSON.stringify({ display_name: u.display_name, avatar_url: u.avatar_url?.slice(0, 30), follower_count: u.follower_count, followers }));
    return {
      platformAccountId: (tokenResponse?.open_id as string) || "",
      username: u.username || u.display_name?.toLowerCase().replace(/\s+/g, "_") || "unknown",
      displayName: u.display_name || u.username || "",
      avatarUrl: u.avatar_url,
      followers,
    };
  },
});

// ──────────────────────────────────────────
// 8. Pinterest — OAuth 2.0
// ──────────────────────────────────────────
register({
  platform: "pinterest",
  label: "Pinterest",
  authorizeUrl: "https://www.pinterest.com/oauth/",
  tokenUrl: `${process.env.PINTEREST_API_BASE_URL || "https://api-sandbox.pinterest.com"}/v5/oauth/token`,
  profileUrl: `${process.env.PINTEREST_API_BASE_URL || "https://api-sandbox.pinterest.com"}/v5/user_account`,
  scopes: ["boards:read", "boards:write", "pins:read", "pins:write", "user_accounts:read"],
  tokenAuth: "basic",
  clientIdEnv: "PINTEREST_CLIENT_ID",
  clientSecretEnv: "PINTEREST_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { response_type: "code" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const pinterestApiBase = process.env.PINTEREST_API_BASE_URL || "https://api-sandbox.pinterest.com";
    const res = await fetch(`${pinterestApiBase}/v5/user_account`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as {
      username?: string;
      full_name?: string;
      profile_image?: string;
    };
    return {
      platformAccountId: data.username || "",
      username: data.username || "",
      displayName: data.full_name || data.username || "",
      avatarUrl: data.profile_image,
    };
  },
});

// ──────────────────────────────────────────
// 9. Reddit — OAuth 2.0
// ──────────────────────────────────────────
register({
  platform: "reddit",
  label: "Reddit",
  authorizeUrl: "https://www.reddit.com/api/v1/authorize",
  tokenUrl: "https://www.reddit.com/api/v1/access_token",
  profileUrl: "https://oauth.reddit.com/api/v1/me",
  scopes: ["identity", "edit", "flair", "history", "mysubreddits", "read", "report", "submit", "subscribe", "vote", "wikiread", "wikiedit"],
  tokenAuth: "basic",
  clientIdEnv: "REDDIT_CLIENT_ID",
  clientSecretEnv: "REDDIT_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { response_type: "code", duration: "permanent" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "Komet/1.0" },
    });
    const data = (await res.json()) as {
      id?: string;
      name?: string;
      icon_img?: string;
    };
    return {
      platformAccountId: data.id || "",
      username: data.name || "",
      displayName: data.name || "",
      avatarUrl: data.icon_img?.split("?")[0],
    };
  },
});

// ──────────────────────────────────────────
// 10. Discord — OAuth 2.0
// ──────────────────────────────────────────
register({
  platform: "discord",
  label: "Discord",
  authorizeUrl: "https://discord.com/oauth2/authorize",
  tokenUrl: "https://discord.com/api/oauth2/token",
  profileUrl: "https://discord.com/api/users/@me",
  scopes: ["identify", "guilds", "webhook.incoming"],
  tokenAuth: "body",
  clientIdEnv: "DISCORD_CLIENT_ID",
  clientSecretEnv: "DISCORD_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { response_type: "code" },
  tokenContentType: "form",
  transformToken: (raw) => {
    // webhook.incoming returns webhook object in token response
    // Format: { url: "https://discord.com/api/webhooks/...", channel_id: "..." }
    const webhook = raw.webhook as { url?: string; channel_id?: string } | undefined;
    const oauthToken = raw.access_token as string;
    // AccessToken stores webhook URL (used by publishToDiscord)
    // RefreshToken stores the OAuth bearer token (used by channels API for guild listing)
    // Discord webhook.incoming doesn't return refresh_token, so this field is safe to reuse.
    return {
      accessToken: webhook?.url || oauthToken,
      refreshToken: oauthToken,
      expiresIn: raw.expires_in as number | undefined,
    };
  },
  fetchProfile: async (_webhookUrl, tokenResponse) => {
    // accessToken stores webhook URL; use raw token from tokenResponse for API calls
    const rawToken = (tokenResponse?.access_token as string) || _webhookUrl;
    const res = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${rawToken}` },
    });
    const data = (await res.json()) as {
      id?: string;
      username?: string;
      discriminator?: string;
      global_name?: string;
      avatar?: string;
    };
    return {
      platformAccountId: data.id || "",
      username: `${data.username || ""}#${data.discriminator || "0"}`,
      displayName: data.global_name || data.username || "",
      avatarUrl: data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
        : undefined,
    };
  },
});

// ──────────────────────────────────────────
// 11. Snapchat — OAuth 2.0 (Marketing API / Public Profile API)
// Docs: https://developers.snap.com/marketing-api/Ads-API/authentication
//       https://www.ayrshare.com/complete-guide-to-snapchat-api-integration/
// ──────────────────────────────────────────
// NOTE: This replaces the old Snap Kit Login Kit OAuth.
// Marketing API uses different endpoints & scopes than Login Kit.
// Credentials must come from Snap Business Manager (not Snap Kit Portal).
// redirect_uri is REQUIRED in token exchange (handled automatically).
register({
  platform: "snapchat",
  label: "Snapchat",
  authorizeUrl: "https://accounts.snapchat.com/login/oauth2/authorize",
  tokenUrl: "https://accounts.snapchat.com/login/oauth2/access_token",
  profileUrl: "https://businessapi.snapchat.com/v1/public_profiles",
  scopes: ["snapchat-marketing-api", "snapchat-profile-api"],
  tokenAuth: "body",
  clientIdEnv: "SNAPCHAT_CLIENT_ID",
  clientSecretEnv: "SNAPCHAT_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { response_type: "code" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    // Step 1: Try Marketing API (open to all, no allowlist needed)
    // Returns org info via adsapi.snapchat.com/v1/me
    try {
      const meRes = await fetch("https://adsapi.snapchat.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("[Snapchat OAuth] adsapi /v1/me status:", meRes.status);
      if (meRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meData = await meRes.json() as any;
        console.log("[Snapchat OAuth] /v1/me response:", JSON.stringify(meData).slice(0, 500));
        const org = meData?.me || meData || {};
        const orgId = org.organization_id as string || "";
        const orgName = org.organization_name as string || org.display_name as string || "";
        if (orgId || orgName) {
          return {
            platformAccountId: orgId,
            username: (orgName || "snapchat_user").toLowerCase().replace(/\s+/g, "_"),
            displayName: orgName || "Snapchat Business",
            avatarUrl: undefined,
          };
        }
      }
    } catch (e) {
      console.warn("[Snapchat OAuth] Marketing API failed:", (e as Error)?.message);
    }

    // Step 2: Try Public Profile API (requires allowlist — may return 404)
    try {
      const res = await fetch("https://businessapi.snapchat.com/v1/public_profiles", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("[Snapchat OAuth] Profiles API status:", res.status);
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await res.json() as any;
        const profiles: Array<Record<string, unknown>> = data?.public_profiles || data?.profiles || data?.items || [];
        if (profiles.length > 0) {
          const p = profiles[0];
          return {
            platformAccountId: (p.id || p.profile_id || "") as string,
            username: ((p.username || (p.display_name as string)?.toLowerCase().replace(/\s+/g, "_")) || "snapchat_profile") as string,
            displayName: ((p.display_name || p.name) || "Snapchat Public Profile") as string,
            avatarUrl: p.avatar_url as string | undefined,
          };
        }
      }
    } catch (e) {
      console.warn("[Snapchat OAuth] Public Profile API failed:", (e as Error)?.message);
    }

    // Fallback
    return {
      platformAccountId: "",
      username: "snapchat_user",
      displayName: "Snapchat (pending app review)",
      avatarUrl: undefined,
    };
  },
});

// ──────────────────────────────────────────
// 12. Google Business — OAuth 2.0 (Google)
// ──────────────────────────────────────────
register({
  platform: "googlebusiness",
  label: "Google Business",
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  profileUrl: "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
  scopes: ["https://www.googleapis.com/auth/business.manage"],
  tokenAuth: "body",
  clientIdEnv: "GOOGLE_BUSINESS_CLIENT_ID",
  clientSecretEnv: "GOOGLE_BUSINESS_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { access_type: "offline", prompt: "consent" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = (await res.json()) as {
      accounts?: { name?: string; accountName?: string; profilePhotoUrl?: string }[];
    };
    const acct = data.accounts?.[0] || {};
    return {
      platformAccountId: acct.name || "",
      username: acct.accountName?.toLowerCase().replace(/\s+/g, "") || "",
      displayName: acct.accountName || "",
      avatarUrl: acct.profilePhotoUrl,
    };
  },
});

// ──────────────────────────────────────────
// 13. WhatsApp — OAuth 2.0 (Meta / WhatsApp Cloud API)
// ──────────────────────────────────────────
register({
  platform: "whatsapp",
  label: "WhatsApp",
  authorizeUrl: "https://www.facebook.com/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
  profileUrl: "https://graph.facebook.com/v19.0/me",
  scopes: ["whatsapp_business_messaging", "whatsapp_business_manage", "business_management"],
  tokenAuth: "body",
  clientIdEnv: "WHATSAPP_CLIENT_ID",
  clientSecretEnv: "WHATSAPP_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { response_type: "code" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`
    );
    const data = (await res.json()) as { id: string; name: string };
    return {
      platformAccountId: data.id,
      username: data.name.toLowerCase().replace(/\s+/g, "_"),
      displayName: data.name,
    };
  },
});

// ──────────────────────────────────────────
// 9. LinkedIn — OAuth 2.0
// ──────────────────────────────────────────
register({
  platform: "linkedin",
  label: "LinkedIn",
  authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  profileUrl: "https://api.linkedin.com/v2/userinfo",
  scopes: ["openid", "profile", "email", "w_member_social_feed"],
  tokenAuth: "body",
  clientIdEnv: "LINKEDIN_CLIENT_ID",
  clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
  usePkce: false,
  redirectPath: "/api/oauth/callback",
  extraAuthorizeParams: { response_type: "code" },
  tokenContentType: "form",
  transformToken: (raw) => ({
    accessToken: raw.access_token as string,
    refreshToken: raw.refresh_token as string | undefined,
    expiresIn: raw.expires_in as number | undefined,
  }),
  fetchProfile: async (accessToken) => {
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as {
      sub?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
      email?: string;
    };
    const displayName = data.name || `${data.given_name || ""} ${data.family_name || ""}`.trim();
    return {
      platformAccountId: data.sub || "",
      username: data.email?.split("@")[0] || displayName.toLowerCase().replace(/\s+/g, "-"),
      displayName,
      avatarUrl: data.picture,
    };
  },
});

// ===== Exported Helpers =====

export function getOAuthConfig(platform: string): OAuthConfig | undefined {
  return configs[platform];
}

export function getAllOAuthPlatforms(): string[] {
  return Object.keys(configs);
}

export function getPlatformAuthUrl(
  platform: string,
  options: { state: string; codeVerifier?: string; redirectUri: string; profileId: string }
): string | null {
  const cfg = getOAuthConfig(platform);
  if (!cfg) return null;

  const clientId = getEnv(cfg.clientIdEnv);
  if (!clientId) return null;

  // TikTok requires comma-separated scopes; most others use space
  const scopeSeparator = platform === "tiktok" ? "," : " ";

  const params = new URLSearchParams({
    redirect_uri: options.redirectUri,
    response_type: "code",
    scope: cfg.scopes.join(scopeSeparator),
    state: options.state,
    ...cfg.extraAuthorizeParams,
  });

  if (cfg.usePkce && options.codeVerifier) {
    // Generate code_challenge from code_verifier using SHA-256
    const challenge = createHash("sha256")
      .update(options.codeVerifier)
      .digest("base64url");
    params.set("code_challenge", challenge);
    params.set("code_challenge_method", "S256");
  }

  // TikTok uses client_key instead of client_id
  if (platform === "tiktok") {
    params.set("client_key", clientId);
  } else {
    params.set("client_id", clientId);
  }

  return `${cfg.authorizeUrl}?${params.toString()}`;
}

export function getRedirectUri(request: Request): string {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  return `${origin}/api/oauth/callback`;
}

/**
 * Generate a crypto-safe random string for PKCE or state.
 */
export function generateRandomString(length = 43): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
