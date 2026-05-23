import type { Message } from "@/lib/types/database";

export const MESSAGE_MAX_LENGTH = 2000;

export function threadPath(listingId: string, otherUserId: string): string {
  return `/messages/${listingId}/${otherUserId}`;
}

export function getOtherUserId(
  message: Pick<Message, "from_user" | "to_user">,
  currentUserId: string
): string {
  return message.from_user === currentUserId
    ? message.to_user
    : message.from_user;
}

export interface InboxThread {
  listingId: string;
  listingTitle: string;
  listingImagePath: string | null;
  sellerId: string;
  otherUserId: string;
  otherUserLabel: string;
  latestBody: string;
  latestAt: string;
  unreadCount: number;
}

type RawMessage = Pick<
  Message,
  "id" | "listing_id" | "from_user" | "to_user" | "body" | "created_at" | "read_at"
>;

type ListingMeta = {
  id: string;
  title: string;
  user_id: string;
  listing_images: { storage_path: string; display_order: number }[];
};

export function buildInboxThreads(
  messages: RawMessage[],
  listings: ListingMeta[],
  currentUserId: string
): InboxThread[] {
  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const threadMap = new Map<
    string,
    {
      latest: RawMessage;
      unreadCount: number;
    }
  >();

  for (const message of messages) {
    const otherUserId = getOtherUserId(message, currentUserId);
    const key = `${message.listing_id}:${otherUserId}`;
    const existing = threadMap.get(key);

    if (!existing) {
      threadMap.set(key, {
        latest: message,
        unreadCount:
          message.to_user === currentUserId && message.read_at === null ? 1 : 0,
      });
      continue;
    }

    if (message.to_user === currentUserId && message.read_at === null) {
      existing.unreadCount += 1;
    }
  }

  const threads: InboxThread[] = [];

  for (const [key, { latest, unreadCount }] of threadMap) {
    const listingId = latest.listing_id;
    const listing = listingMap.get(listingId);
    if (!listing) continue;

    const otherUserId = getOtherUserId(latest, currentUserId);
    const coverImage = [...(listing.listing_images ?? [])].sort(
      (a, b) => a.display_order - b.display_order
    )[0];

    threads.push({
      listingId,
      listingTitle: listing.title,
      listingImagePath: coverImage?.storage_path ?? null,
      sellerId: listing.user_id,
      otherUserId,
      otherUserLabel:
        otherUserId === listing.user_id ? "Seller" : "Interested buyer",
      latestBody: latest.body,
      latestAt: latest.created_at,
      unreadCount,
    });
  }

  return threads.sort(
    (a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
  );
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return new Intl.DateTimeFormat("en-NZ", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
