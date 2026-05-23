import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getListingImageUrl } from "@/lib/supabase/storage";
import { buildInboxThreads, threadPath, formatMessageTime } from "@/lib/messages";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/messages");
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, listing_id, from_user, to_user, body, created_at, read_at")
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("messages inbox error:", error);
  }

  const listingIds = [
    ...new Set((messages ?? []).map((message) => message.listing_id)),
  ];

  let listings: {
    id: string;
    title: string;
    user_id: string;
    listing_images: { storage_path: string; display_order: number }[];
  }[] = [];

  if (listingIds.length > 0) {
    const { data } = await supabase
      .from("listings")
      .select(
        "id, title, user_id, listing_images(storage_path, display_order)"
      )
      .in("id", listingIds);

    listings = data ?? [];
  }

  const threads = buildInboxThreads(messages ?? [], listings, user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conversations about listings you&apos;re buying or selling.
      </p>

      {threads.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">💬</div>
          <p className="font-medium">No messages yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            When you contact a seller or someone messages you about your
            listing, it will show up here.
          </p>
          <Link
            href="/fins"
            className="mt-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Browse fins
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {threads.map((thread) => (
            <li key={`${thread.listingId}:${thread.otherUserId}`}>
              <Link
                href={threadPath(thread.listingId, thread.otherUserId)}
                className="flex gap-3 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                  {thread.listingImagePath ? (
                    <Image
                      src={getListingImageUrl(thread.listingImagePath)}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">
                      🏄
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium">{thread.listingTitle}</p>
                    <time
                      dateTime={thread.latestAt}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {formatMessageTime(thread.latestAt)}
                    </time>
                  </div>
                  <p className="text-xs text-[var(--color-teal-600)]">
                    {thread.otherUserLabel}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {thread.latestBody}
                  </p>
                </div>
                {thread.unreadCount > 0 && (
                  <Badge className="mt-1 shrink-0 border-0 bg-[var(--color-teal-500)] text-white">
                    {thread.unreadCount}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
