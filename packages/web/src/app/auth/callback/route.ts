import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const { createServerClient } = await import("@supabase/ssr");

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get the authenticated user to sync with local DB
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const email = authUser.email || "";
        const name =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          email.split("@")[0];

        const { prisma } = await import("@komet/db");

        await prisma.user.upsert({
          where: { supabaseId: authUser.id },
          update: {
            email,
            name,
            lastSeenAt: new Date(),
          },
          create: {
            supabaseId: authUser.id,
            email,
            name,
            lastSeenAt: new Date(),
          },
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
