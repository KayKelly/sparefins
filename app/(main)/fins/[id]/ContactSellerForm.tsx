"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendMessage } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_MAX_LENGTH } from "@/lib/messages";

const initialState = { error: null as string | null };

export default function ContactSellerForm({
  listingId,
}: {
  listingId: string;
}) {
  const [state, action, pending] = useActionState(sendMessage, initialState);

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Contact seller
      </h2>
      <form action={action} className="space-y-3">
        <input type="hidden" name="listingId" value={listingId} />
        <input type="hidden" name="redirectAfter" value="true" />
        <Textarea
          name="body"
          required
          rows={4}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Hi, is this fin still available? I'm interested in picking it up."
          className="min-h-24 resize-y"
        />
        {state.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-11 w-full text-base font-semibold sm:w-auto sm:px-8"
        >
          {pending ? "Sending…" : "Send message"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        The seller will see your message in their inbox. Sort payment between
        yourselves.
      </p>
    </div>
  );
}

export function ContactSellerPrompt({ loginNext }: { loginNext: string }) {
  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">Interested in this fin?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to message the seller directly.
      </p>
      <Link
        href={`/login?next=${encodeURIComponent(loginNext)}`}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Sign in to message seller
      </Link>
    </div>
  );
}

export function OwnListingNotice({
  listingId,
  editHref,
}: {
  listingId: string;
  editHref?: string;
}) {
  void listingId;
  return (
    <div className="mt-8 rounded-xl border border-[var(--color-teal-200)] bg-[var(--color-teal-50)] p-5">
      <p className="text-sm font-medium text-[var(--color-teal-700)]">
        This is your listing
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Check your inbox for messages from interested buyers.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {editHref && (
          <Link
            href={editHref}
            className="inline-flex h-8 items-center justify-center rounded-lg bg-[var(--color-accent)] px-3 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Edit listing
          </Link>
        )}
        <Link
          href="/messages"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          View messages
        </Link>
        <Link
          href="/listings/mine"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          My listings
        </Link>
      </div>
    </div>
  );
}
