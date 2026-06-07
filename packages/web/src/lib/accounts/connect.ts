// Account connection helpers (replacing Zernio OAuth flow)

/** Start OAuth flow for a platform */
export async function startOAuth(
  platform: string,
  profileId?: string
): Promise<{ authUrl: string }> {
  const res = await fetch("/api/oauth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, profileId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to start OAuth");
  }

  return res.json();
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
