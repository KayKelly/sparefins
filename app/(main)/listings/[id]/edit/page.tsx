import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type {
  FinSystem,
  FinSizeBucket,
  FinPosition,
  FinSide,
  ListingCondition,
} from "@/lib/types/database";
import EditListingForm from "./EditListingForm";

export const metadata: Metadata = { title: "Edit listing" };

interface ListingForEdit {
  id: string;
  title: string;
  description: string | null;
  price_nzd: number | null;
  condition: ListingCondition;
  location_label: string | null;
  fin_details: {
    system: FinSystem;
    size_bucket: FinSizeBucket | null;
    position: FinPosition | null;
    side: FinSide;
    quantity: number;
    brand: string | null;
    model: string | null;
  };
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/listings/${id}/edit`);

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id, title, description, price_nzd, condition, location_label, user_id,
      fin_details!inner(system, size_bucket, position, side, quantity, brand, model)
    `
    )
    .eq("id", id)
    .eq("category", "fin")
    .single();

  if (error || !data) notFound();
  if (data.user_id !== user.id) notFound();

  const finDetails = data.fin_details;
  const fin = Array.isArray(finDetails) ? finDetails[0] : finDetails;
  if (!fin) notFound();

  const listing: ListingForEdit = {
    id: data.id,
    title: data.title,
    description: data.description,
    price_nzd: data.price_nzd,
    condition: data.condition,
    location_label: data.location_label,
    fin_details: fin,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight">Edit listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your fin listing details.
        </p>
      </div>
      <EditListingForm listing={listing} />
    </div>
  );
}
