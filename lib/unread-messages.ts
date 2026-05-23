import { createClient } from "@/lib/supabase/server";

export async function getUnreadMessageCount(
  userId: string | undefined
): Promise<number> {
  if (!userId) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("to_user", userId)
    .is("read_at", null);

  if (error) {
    console.error("unread count error:", error);
    return 0;
  }

  return count ?? 0;
}
