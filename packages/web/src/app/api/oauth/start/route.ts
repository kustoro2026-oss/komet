import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-admin";
import { getOAuthConfig, getPlatformAuthUrl, generateRandomString, getRedirectUri } from "@/lib/accounts/oauth-config";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const platform = body?.platform as string | undefined;
    const profileId = body?.profileId as string | undefined;

    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    const cfg = getOAuthConfig(platform);
    if (!cfg) {
      return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
    }

    // Check if platform credentials are configured
    const clientId = process.env[cfg.clientIdEnv];
    const clientSecret = process.env[cfg.clientSecretEnv];
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: `${cfg.label} OAuth is not configured. Missing ${cfg.clientIdEnv} or ${cfg.clientSecretEnv}` },
        { status: 400 }
      );
    }

    const redirectUri = getRedirectUri(request);
    const state = generateRandomString();
    let codeVerifier: string | undefined;

    if (cfg.usePkce) {
      codeVerifier = generateRandomString(64);
    }

    const authUrl = getPlatformAuthUrl(platform, {
      state,
      codeVerifier,
      redirectUri,
      profileId,
    });

    if (!authUrl) {
      return NextResponse.json({ error: "Failed to generate OAuth URL" }, { status: 500 });
    }

    // Store state + metadata in encrypted cookie
    const cookieStore = cookies();
    const oauthState = JSON.stringify({
      state,
      codeVerifier,
      platform,
      profileId,
      redirectUri,
    });

    cookieStore.set("oauth_state", Buffer.from(oauthState).toString("base64"), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return NextResponse.json({ authUrl });
  } catch (err) {
    console.error("OAuth start error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
