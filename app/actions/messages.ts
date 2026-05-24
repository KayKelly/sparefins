"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MESSAGE_MAX_LENGTH, threadPath } from "@/lib/messages";

export interface SendMessageState {
  error: string | null;
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null) ?? "";
}

async function getListingSeller(listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", listingId)
    .single();

  if (error || !data) return null;
  return data;
}

async function hasExistingThread(
  listingId: string,
  userA: string,
  userB: string
): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .in("from_user", [userA, userB])
    .in("to_user", [userA, userB]);

  if (error) return false;
  return (count ?? 0) > 0;
}

export async function sendMessage(
  _prev: SendMessageState,
  formData: FormData
): Promise<SendMessageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to send a message." };
  }

  const listingId = str(formData, "listingId").trim();
  const toUserId = str(formData, "toUserId").trim() || null;
  const body = str(formData, "body").trim();
  const redirectAfter = str(formData, "redirectAfter") === "true";

  if (!listingId) {
    return { error: "Listing not found." };
  }

  if (!body) {
    return { error: "Write a message before sending." };
  }

  if (body.length > MESSAGE_MAX_LENGTH) {
    return {
      error: `Messages must be ${MESSAGE_MAX_LENGTH} characters or fewer.`,
    };
  }

  const listing = await getListingSeller(listingId);
  if (!listing) {
    return { error: "Listing not found." };
  }

  if (listing.status !== "active") {
    return { error: "This listing is no longer available." };
  }

  const sellerId = listing.user_id;
  let recipientId: string;

  if (user.id === sellerId) {
    if (!toUserId) {
      return { error: "Choose who to reply to." };
    }
    if (toUserId === user.id) {
      return { error: "You cannot message yourself." };
    }
    const threadExists = await hasExistingThread(listingId, user.id, toUserId);
    if (!threadExists) {
      return { error: "You can only reply to existing conversations." };
    }
    recipientId = toUserId;
  } else {
    if (toUserId && toUserId !== sellerId) {
      return { error: "Invalid recipient." };
    }
    recipientId = sellerId;
  }

  if (recipientId === user.id) {
    return { error: "You cannot message yourself." };
  }

  const { error } = await supabase.from("messages").insert({
    listing_id: listingId,
    from_user: user.id,
    to_user: recipientId,
    body,
  });

  if (error) {
    console.error("sendMessage error:", error);
    return { error: "Could not send message. Try again." };
  }

  revalidatePath("/messages");
  revalidatePath(threadPath(listingId, recipientId));
  revalidatePath(threadPath(listingId, user.id));
  revalidatePath(`/fins/${listingId}`);

  if (redirectAfter) {
    redirect(threadPath(listingId, recipientId));
  }

  return { error: null };
}

/** Revalidate inbox + nav badge after messages are marked read on the client. */
export async function revalidateAfterThreadRead(
  listingId: string,
  otherUserId: string
) {
  revalidatePath("/messages");
  revalidatePath(threadPath(listingId, otherUserId));
  revalidatePath("/", "layout");
}
