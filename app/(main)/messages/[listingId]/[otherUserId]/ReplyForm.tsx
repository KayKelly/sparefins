"use client";

import { useActionState } from "react";
import { sendMessage } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_MAX_LENGTH } from "@/lib/messages";

const initialState = { error: null as string | null };

export default function ReplyForm({
  listingId,
  toUserId,
}: {
  listingId: string;
  toUserId: string;
}) {
  const [state, action, pending] = useActionState(sendMessage, initialState);

  return (
    <form action={action} className="space-y-3 border-t border-border bg-card p-4">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="toUserId" value={toUserId} />
      <Textarea
        name="body"
        required
        rows={3}
        maxLength={MESSAGE_MAX_LENGTH}
        placeholder="Write a reply…"
        className="min-h-20 resize-y"
      />
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reply"}
      </Button>
    </form>
  );
}
