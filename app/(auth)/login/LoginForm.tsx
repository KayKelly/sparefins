"use client";

import { useActionState } from "react";
import { sendMagicLink } from "@/app/actions/auth";

const initialState = { error: null as string | null, sent: false };

export default function LoginForm({ next = "/" }: { next?: string }) {
  const [state, action, pending] = useActionState(sendMagicLink, initialState);

  if (state.sent) {
    return (
      <div className="rounded-xl border border-[var(--color-teal-200)] bg-[var(--color-teal-50)] p-6 text-center">
        <div className="mb-2 text-2xl">📬</div>
        <p className="font-medium text-[var(--color-teal-700)]">Check your email</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a sign-in link. It expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
      </div>

      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send magic link"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        No password needed. No spam. Just a link.
      </p>
    </form>
  );
}
