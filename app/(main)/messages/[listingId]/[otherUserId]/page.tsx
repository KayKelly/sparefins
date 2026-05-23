import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { markThreadRead } from "@/app/actions/messages";
import { formatMessageTime, threadPath } from "@/lib/messages";
import { cn } from "@/lib/utils";
import ReplyForm from "./ReplyForm";

export const metadata: Metadata = {
  title: "Conversation",
};

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ listingId: string; otherUserId: string }>;
}) {
  const { listingId, otherUserId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(threadPath(listingId, otherUserId))}`);
  }

  if (otherUserId === user.id) {
    notFound();
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, user_id, status")
    .eq("id", listingId)
    .single();

  if (!listing) notFound();

  const { count: messageCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .in("from_user", [user.id, otherUserId])
    .in("to_user", [user.id, otherUserId]);

  const isParticipant =
    user.id === listing.user_id || (messageCount ?? 0) > 0;

  if (!isParticipant) notFound();

  await markThreadRead(listingId, otherUserId);

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, from_user, to_user, body, created_at")
    .eq("listing_id", listingId)
    .in("from_user", [user.id, otherUserId])
    .in("to_user", [user.id, otherUserId])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("thread messages error:", error);
  }

  const counterpartyLabel =
    otherUserId === listing.user_id ? "Seller" : "Interested buyer";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col px-4 py-6 sm:px-6">
      <nav className="mb-4">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to messages
        </Link>
      </nav>

      <header className="mb-4 rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {counterpartyLabel}
        </p>
        <h1 className="mt-1 font-semibold leading-snug">{listing.title}</h1>
        <Link
          href={`/fins/${listingId}`}
          className="mt-2 inline-block text-sm text-[var(--color-teal-600)] hover:underline"
        >
          View listing
        </Link>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {(messages ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages in this conversation yet.
          </p>
        ) : (
          (messages ?? []).map((message) => {
            const isMine = message.from_user === user.id;
            return (
              <div
                key={message.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isMine
                      ? "rounded-br-md bg-[var(--color-teal-600)] text-white"
                      : "rounded-bl-md border border-border bg-card"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <time
                    dateTime={message.created_at}
                    className={cn(
                      "mt-1 block text-[10px]",
                      isMine ? "text-teal-100" : "text-muted-foreground"
                    )}
                  >
                    {formatMessageTime(message.created_at)}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>

      {listing.status === "active" ? (
        <ReplyForm listingId={listingId} toUserId={otherUserId} />
      ) : (
        <p className="border-t border-border p-4 text-center text-sm text-muted-foreground">
          This listing is no longer active. You can still read the conversation
          above.
        </p>
      )}
    </div>
  );
}
