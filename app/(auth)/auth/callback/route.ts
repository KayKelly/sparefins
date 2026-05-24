import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // On Vercel, request.url uses the internal host. Use x-forwarded-host
      // to redirect to the actual public domain so cookies are scoped correctly.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const redirectBase =
        forwardedHost && process.env.NODE_ENV !== "development"
          ? `https://${forwardedHost}`
          : origin;
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  // Something went wrong — send them back to login with an error hint
  const errorRedirect = new URL("/login", origin);
  errorRedirect.searchParams.set("error", "auth");
  return NextResponse.redirect(errorRedirect.toString());
}
