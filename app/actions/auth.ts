"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

interface MagicLinkState {
  error: string | null;
  sent: boolean;
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null) ?? "";
}

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return { error: "Please enter a valid email address.", sent: false };
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "";
  const next = str(formData, "next").trim() || "/";
  const callbackUrl = new URL("/auth/callback", origin);
  if (next.startsWith("/") && !next.startsWith("//")) {
    callbackUrl.searchParams.set("next", next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    return { error: error.message, sent: false };
  }

  return { error: null, sent: true };
}
