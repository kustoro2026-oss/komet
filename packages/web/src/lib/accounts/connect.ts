// Account connection helpers (replacing Zernio OAuth flow)
// Stub implementations — OAuth flow needs platform-specific implementation

/** Start OAuth flow for a platform */
export async function startOAuth(
  platform: string
): Promise<{ authUrl: string; state: string }> {
  // For now, redirect to a placeholder that explains OAuth is being set up
  // TODO: Implement direct OAuth flow for each platform

  // For Twitter/X, we'd need OAuth 2.0 PKCE flow
  // For now, show a message
  throw new Error(
    `Direct OAuth for ${platform} is not yet configured. ` +
    "Please configure the platform's OAuth credentials in your environment variables."
  );
}

/** Connect Bluesky with identifier and app password */
export async function connectBluesky(
  identifier: string,
  appPassword: string,
  profileId: string
): Promise<{ id: string; platform: string }> {
  // Bluesky uses AT Protocol with app passwords — needs server-side implementation
  // For now, store the connection request and return a placeholder
  console.log(`[Accounts] Bluesky connect requested: identifier=${identifier}, profileId=${profileId}`);

  // Try to save via API
  const res = await fetch("/api/accounts/connect/bluesky", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, appPassword, profileId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to connect Bluesky");
  }

  return res.json();
}
