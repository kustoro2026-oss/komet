import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function createSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Missing Supabase admin environment variables");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: "Sign up failed" };

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.user_metadata?.name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    };

    return { user: authUser };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: "Sign in failed" };

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.user_metadata?.name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    };

    return { user: authUser };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function signOut(): Promise<{ error?: string }> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getCurrentUser(): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: "No user found" };

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.user_metadata?.name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    };

    return { user: authUser };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function resetPassword(
  email: string
): Promise<{ error?: string }> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
    });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updatePassword(
  newPassword: string
): Promise<{ error?: string }> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getSession() {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return { session: null, error: error.message };
    return { session: data.session, error: undefined };
  } catch (err) {
    return { session: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
