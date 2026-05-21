"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

interface MagicLinkState {
  error: string | null;
  sent: boolean;
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message, sent: false };
  }

  return { error: null, sent: true };
}
