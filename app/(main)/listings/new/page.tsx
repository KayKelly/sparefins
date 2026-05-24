import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FinListingForm from "./FinListingForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell a fin",
};

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/listings/new");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Sell a fin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The more attributes you fill in, the easier it is for the right buyer
          to find it.
        </p>
      </div>
      <FinListingForm />
    </div>
  );
}
