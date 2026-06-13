import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export const dynamic = "force-dynamic";

// In-memory store for active auth sessions (keyed by temp sessionId)
const authSessions = new Map<string, { client: TelegramClient; phoneNumber: string; phoneCodeHash: string }>();

const TELEGRAM_API_ID = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || "";

function getApiCredentials() {
  if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
    throw new Error("TELEGRAM_API_ID and TELEGRAM_API_HASH are not configured");
  }
  return { apiId: TELEGRAM_API_ID, apiHash: TELEGRAM_API_HASH };
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const step = body?.step as string | undefined;
    const profileId = body?.profileId as string | undefined;

    if (!step) {
      return NextResponse.json({ error: "Step is required" }, { status: 400 });
    }

    // ── Step 1: Send verification code ──────────────────────────
    if (step === "sendCode") {
      const phoneNumber = body?.phoneNumber as string | undefined;

      if (!phoneNumber) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }

      if (!profileId) {
        return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
      }

      // Check if this phone number is already connected
      const existing = await prisma.socialAccount.findFirst({
        where: { platform: "telegram", platformAccountId: phoneNumber, isActive: true },
      });
      if (existing) {
        return NextResponse.json({ error: "This phone number is already connected" }, { status: 409 });
      }

      const { apiId, apiHash } = getApiCredentials();
      const stringSession = new StringSession("");
      const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 2,
      });

      try {
        await client.connect();

        const sendResult = await client.sendCode(
          { apiId, apiHash },
          phoneNumber
        );

        const sessionId = crypto.randomUUID();
        authSessions.set(sessionId, {
          client,
          phoneNumber,
          phoneCodeHash: sendResult.phoneCodeHash,
        });

        return NextResponse.json({
          success: true,
          sessionId,
          timeout: sendResult.timeout,
          // type: app/sms/call - hints for UI
          codeType: sendResult.type?.className || "sms",
        });
      } catch (err) {
        await client.disconnect().catch(() => {});
        const msg = err instanceof Error ? err.message : "Failed to send code";
        console.error("[Telegram sendCode]", msg);
        // Common error: phone number not registered
        if (msg.includes("PHONE_NUMBER_INVALID")) {
          return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
        }
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // ── Step 2: Verify code ─────────────────────────────────────
    if (step === "verifyCode") {
      const sessionId = body?.sessionId as string | undefined;
      const phoneCode = body?.phoneCode as string | undefined;

      if (!sessionId || !phoneCode) {
        return NextResponse.json({ error: "sessionId and phoneCode are required" }, { status: 400 });
      }

      const session = authSessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: "Session expired. Please restart the login." }, { status: 400 });
      }

      try {
        const signInResult = await session.client.invokeSignIn(
          session.client,
          {
            phoneNumber: session.phoneNumber,
            phoneCodeHash: session.phoneCodeHash,
            phoneCode,
          },
          undefined
        );

        // Check if 2FA is required
        if (!signInResult) {
          // Try explicit sign in
          try {
            await session.client.signInWithPassword(
              { apiHash: TELEGRAM_API_HASH, apiId: TELEGRAM_API_ID },
              {
                phoneNumber: session.phoneNumber,
                phoneCodeHash: session.phoneCodeHash,
                phoneCode,
              }
            );
          } catch (innerErr) {
            const innerMsg = innerErr instanceof Error ? innerErr.message : "";
            if (innerMsg.includes("2FA") || innerMsg.includes("PASSWORD_HASH_INVALID") || innerMsg.includes("SRP")) {
              return NextResponse.json({
                success: true,
                needs2FA: true,
                sessionId,
              });
            }
            throw innerErr;
          }
        }

        // No 2FA — save the session
        const sessionString = session.client.session.save() as unknown as string;

        // Get user info
        const me = await session.client.getMe();
        const displayName = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.username || `+${session.phoneNumber}`;
        const username = me.username ? `@${me.username}` : `+${session.phoneNumber}`;
        const phoneNumber = session.phoneNumber;

        // Save to DB
        const account = await prisma.socialAccount.create({
          data: {
            profileId,
            platform: "telegram",
            platformAccountId: phoneNumber,
            username,
            displayName,
            accessToken: sessionString,
            isActive: true,
          },
        });

        // Clean up auth session
        authSessions.delete(sessionId);

        return NextResponse.json({
          success: true,
          connected: true,
          id: account.id,
          platform: "telegram",
          username: account.username,
          displayName: account.displayName,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid code";

        // Check for 2FA requirement from signIn error
        if (msg.includes("2FA") || msg.includes("PASSWORD_HASH_INVALID") || msg.includes("SRP") || msg.includes("password")) {
          return NextResponse.json({
            success: true,
            needs2FA: true,
            sessionId,
          });
        }

        console.error("[Telegram verifyCode]", msg);
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // ── Step 3: Verify 2FA password ─────────────────────────────
    if (step === "verifyPassword") {
      const sessionId = body?.sessionId as string | undefined;
      const password = body?.password as string | undefined;

      if (!sessionId || !password) {
        return NextResponse.json({ error: "sessionId and password are required" }, { status: 400 });
      }

      const session = authSessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: "Session expired. Please restart the login." }, { status: 400 });
      }

      try {
        await session.client.signInWithPassword(
          { apiHash: TELEGRAM_API_HASH, apiId: TELEGRAM_API_ID },
          {
            password: async () => password,
            onError: (err: Error) => {
              throw err;
            },
          }
        );

        // Success — save the session
        const sessionString = session.client.session.save() as unknown as string;

        // Get user info
        const me = await session.client.getMe();
        const displayName = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.username || `+${session.phoneNumber}`;
        const username = me.username ? `@${me.username}` : `+${session.phoneNumber}`;

        // Save to DB
        const account = await prisma.socialAccount.create({
          data: {
            profileId,
            platform: "telegram",
            platformAccountId: session.phoneNumber,
            username,
            displayName,
            accessToken: sessionString,
            isActive: true,
          },
        });

        // Clean up
        authSessions.delete(sessionId);

        return NextResponse.json({
          success: true,
          connected: true,
          id: account.id,
          platform: "telegram",
          username: account.username,
          displayName: account.displayName,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid password";
        console.error("[Telegram verifyPassword]", msg);
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Unknown step: " + step }, { status: 400 });
  } catch (err) {
    console.error("[Telegram Connect] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
