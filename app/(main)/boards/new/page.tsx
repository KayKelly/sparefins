import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import BoardListingForm from "./BoardListingForm";

export const metadata: Metadata = { title: "List a board" };

export default async function NewBoardListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/boards/new");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">List a board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add length, volume, and fin setup so buyers can find exactly what they
          need.
        </p>
      </div>
      <BoardListingForm />
    </div>
  );
}
