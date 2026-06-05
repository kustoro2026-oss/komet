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

  return {
    user: {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.user_metadata?.name,
    },
    error: null,
  };
}
