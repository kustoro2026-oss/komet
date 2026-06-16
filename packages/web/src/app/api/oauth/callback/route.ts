import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOAuthConfig } from "@/lib/accounts/oauth-config";
import { exchangeCodeForTokens } from "@/lib/accounts/oauth-clients";
import { prisma } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    // If the platform returned an error (e.g. user denied)
    if (errorParam) {
      console.error("OAuth callback error from platform:", errorParam, searchParams.get("error_description"));
      return NextResponse.redirect(new URL("/accounts/connect?error=oauth_denied", request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/accounts/connect?error=no_code", request.url));
    }

    // Read OAuth state from cookie
    const cookieStore = cookies();
    const oauthCookie = cookieStore.get("oauth_state");
    if (!oauthCookie) {
      return NextResponse.redirect(new URL("/accounts/connect?error=expired", request.url));
    }

    let oauthState: {
      state: string;
      codeVerifier?: string;
      platform: string;
      profileId: string;
      redirectUri: string;
    };

    try {
      oauthState = JSON.parse(Buffer.from(oauthCookie.value, "base64").toString("utf-8"));
    } catch {
      return NextResponse.redirect(new URL("/accounts/connect?error=invalid_state", request.url));
    }

    // Validate state (check the encoded state from our cookie matches)
    const receivedState = searchParams.get("state");
    if (receivedState) {
      try {
        const parsedState = JSON.parse(receivedState);
        if (parsedState.s !== oauthState.state) {
          return NextResponse.redirect(new URL("/accounts/connect?error=state_mismatch", request.url));
        }
        // Also extract platform from state if available
        oauthState.platform = parsedState.p || oauthState.platform;
        oauthState.profileId = parsedState.pid || oauthState.profileId;
      } catch {
        // If state is not JSON, just compare directly
        if (receivedState !== oauthState.state) {
          return NextResponse.redirect(new URL("/accounts/connect?error=state_mismatch", request.url));
        }
      }
    }

    // Clear the oauth cookie
    cookieStore.delete("oauth_state");

    // Exchange code for tokens
    const tokenResult = await exchangeCodeForTokens(
      oauthState.platform,
      code,
      oauthState.redirectUri,
      oauthState.codeVerifier
    );

    // Fetch profile from platform
    const cfg = getOAuthConfig(oauthState.platform);
    if (!cfg) {
      return NextResponse.redirect(new URL("/accounts/connect?error=unknown_platform", request.url));
    }

    const profile = await cfg.fetchProfile(tokenResult.accessToken, tokenResult.raw);

    console.log("[OAuth Callback] Token exchange OK for", oauthState.platform);
    console.log("[OAuth Callback] Raw token response keys:", Object.keys(tokenResult.raw));
    console.log("[OAuth Callback] open_id:", tokenResult.raw.open_id);
    console.log("[OAuth Callback] Profile result:", JSON.stringify(profile));
    console.log("[OAuth Callback] profileId from state:", oauthState.profileId);

    // Save to database
    console.log("[OAuth Callback] 💾 SAVING — followers:", profile.followers, "| username:", profile.username, "| platformAccountId:", profile.platformAccountId);

    // Verify the profile exists
    const profileExists = await prisma.profile.findUnique({
      where: { id: oauthState.profileId },
      select: { id: true },
    });

    if (!profileExists) {
      return NextResponse.redirect(new URL("/accounts/connect?error=profile_not_found", request.url));
    }

    // Find existing account or create new one
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingAccount = await (prisma.socialAccount as any).findFirst({
      where: {
        profileId: oauthState.profileId,
        platform: oauthState.platform,
        platformAccountId: profile.platformAccountId || undefined,
      },
    });

    let accountId: string;

    if (existingAccount) {
      accountId = existingAccount.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.socialAccount as any).update({
        where: { id: existingAccount.id },
        data: {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          followers: profile.followers || 0,
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken,
          tokenExpiresAt: tokenResult.expiresAt,
          isActive: true,
        },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newAccount = await (prisma.socialAccount as any).create({
        data: {
          profileId: oauthState.profileId,
          platform: oauthState.platform,
          platformAccountId: profile.platformAccountId,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          followers: profile.followers || 0,
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken,
          tokenExpiresAt: tokenResult.expiresAt,
          isActive: true,
        },
      });
      accountId = newAccount.id;
    }

    // Create notification for account connection (fire-and-forget)
    void (async () => {
      try {
        const profileRecord = await prisma.profile.findUnique({
          where: { id: oauthState.profileId },
          include: { workspace: { select: { ownerId: true } } },
        });
        if (profileRecord?.workspace?.ownerId) {
          await prisma.notification.create({
            data: {
              userId: profileRecord.workspace.ownerId,
              type: "account.connected",
              title: "Account connected",
              message: `${oauthState.platform.charAt(0).toUpperCase() + oauthState.platform.slice(1)} account connected successfully`,
              data: { platform: oauthState.platform, username: profile.username },
            },
          });
        }
      } catch (notifErr) {
        console.error("[OAuth Callback] Failed to create notification:", notifErr);
      }
    })();

    // For Pinterest, redirect to board selection page
    if (oauthState.platform === "pinterest") {
      return NextResponse.redirect(
        new URL(`/accounts/pinterest-board?accountId=${accountId}`, request.url)
      );
    }

    // Redirect to accounts page with success
    return NextResponse.redirect(new URL("/accounts?connected=true", request.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/accounts/connect?error=callback_failed&details=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
