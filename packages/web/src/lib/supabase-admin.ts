import { createSupabaseAdminClient } from "@komet/auth";
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

/**
 * Returns a Supabase admin client using the service role key.
 * Bypasses RLS - use only in API routes with proper auth checks.
 */
export function getSupabaseAdmin() {
  return createSupabaseAdminClient();
}

/**
 * Extracts the authenticated user from a NextRequest by reading session cookies.
 * Uses the anon key client (not service role) to respect the session.
 */
export async function getUserFromRequest(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: "Missing Supabase environment variables" };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Read-only for API routes - no cookie writing needed
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null, error: "Unauthorized" };
  }

  // Auto-sync user to Prisma database and get Prisma user ID
  let prismaUserId = data.user.id; // fallback
  try {
    const { prisma } = await import("@komet/db");
    const email = data.user.email || "";
    const name =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      email.split("@")[0];

    const dbUser = await prisma.user.upsert({
      where: { supabaseId: data.user.id },
      update: {
        email,
        name,
        lastSeenAt: new Date(),
      },
      create: {
        supabaseId: data.user.id,
        email,
        name,
        lastSeenAt: new Date(),
      },
    });
    prismaUserId = dbUser.id;
  } catch (dbErr) {
    console.error("Failed to sync user to database:", dbErr);
  }

  return {
    user: {
      id: prismaUserId,
      email: data.user.email || "",
      name: data.user.user_metadata?.name,
    },
    error: null,
  };
}
