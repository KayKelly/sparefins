"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { revalidateAfterThreadRead } from "@/app/actions/messages";

export default function ThreadReadSync({
  listingId,
  otherUserId,
}: {
  listingId: string;
  otherUserId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    void revalidateAfterThreadRead(listingId, otherUserId).then(() => {
      router.refresh();
    });
  }, [listingId, otherUserId, router]);

  return null;
}
