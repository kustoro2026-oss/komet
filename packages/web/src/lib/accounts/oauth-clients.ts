import { getOAuthConfig } from "./oauth-config";

// ===== Token Exchange =====

interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  raw: Record<string, unknown>;
}

/**
 * Exchange an authorization code for access/refresh tokens.
 * Handles platform-specific token endpoint requirements.
 */
export async function exchangeCodeForTokens(
  platform: string,
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<TokenResult> {
  const cfg = getOAuthConfig(platform);
  if (!cfg) throw new Error(`Unknown platform: ${platform}`);

  const clientId = process.env[cfg.clientIdEnv] || "";
  const clientSecret = process.env[cfg.clientSecretEnv] || "";

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  // Basic auth for some platforms (Twitter, Pinterest, Reddit)
  if (cfg.tokenAuth === "basic") {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basic}`;
    // Remove client_secret from body for basic auth platforms
    body.delete("client_secret");
  }

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`Token exchange failed for ${platform}: ${res.status} ${errText}`);
  }

  const raw = (await res.json()) as Record<string, unknown>;

  if (raw.error) {
    throw new Error(`Token exchange error for ${platform}: ${String(raw.error)} - ${String(raw.error_description || "")}`);
  }

  // Use platform transformer if provided
  const transformed = cfg.transformToken ? cfg.transformToken(raw) : null;

  const accessToken = transformed?.accessToken || (raw.access_token as string) || "";
  const refreshToken = transformed?.refreshToken || (raw.refresh_token as string | undefined);
  const expiresIn = transformed?.expiresIn || (raw.expires_in as number | undefined);

  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

  return { accessToken, refreshToken, expiresAt, raw };
}
