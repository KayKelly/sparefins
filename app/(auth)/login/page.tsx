import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <a
            href="/"
            className="text-2xl font-semibold tracking-tight text-[var(--color-teal-600)]"
          >
            Sparefins
          </a>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your email. We&apos;ll send you a magic link.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
