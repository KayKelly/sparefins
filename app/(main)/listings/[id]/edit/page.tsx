import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type {
  FinSystem,
  FinSizeBucket,
  FinPosition,
  FinSide,
  BoardType,
  BoardFinSetup,
  BoardFinSystem,
  ListingCondition,
} from "@/lib/types/database";
import EditListingForm from "./EditListingForm";
import EditBoardListingForm from "./EditBoardListingForm";

export const metadata: Metadata = { title: "Edit listing" };

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
      id, title, description, price_nzd, condition, location_label, user_id, category,
      fin_details(system, size_bucket, position, side, quantity, brand, model),
      board_details(board_type, fin_setup, fin_system, length_inches, volume_litres)
    `
    )
    .eq("id", id)
    .in("category", ["fin", "board"])
    .single();

  if (error || !data) notFound();
  if (data.user_id !== user.id) notFound();

  if (data.category === "fin") {
    const finDetails = data.fin_details;
    const fin = Array.isArray(finDetails) ? finDetails[0] : finDetails;
    if (!fin) notFound();

    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">Edit listing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your fin listing details.
          </p>
        </div>
        <EditListingForm
          listing={{
            id: data.id,
            title: data.title,
            description: data.description,
            price_nzd: data.price_nzd,
            condition: data.condition as ListingCondition,
            location_label: data.location_label,
            fin_details: {
              system: fin.system as FinSystem,
              size_bucket: fin.size_bucket as FinSizeBucket | null,
              position: fin.position as FinPosition | null,
              side: fin.side as FinSide,
              quantity: fin.quantity,
              brand: fin.brand,
              model: fin.model,
            },
          }}
        />
      </div>
    );
  }

  if (data.category === "board") {
    const boardDetails = data.board_details;
    const board = Array.isArray(boardDetails) ? boardDetails[0] : boardDetails;
    if (!board) notFound();

    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">Edit listing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your board listing details.
          </p>
        </div>
        <EditBoardListingForm
          listing={{
            id: data.id,
            title: data.title,
            description: data.description,
            price_nzd: data.price_nzd,
            condition: data.condition as ListingCondition,
            location_label: data.location_label,
            board_details: {
              board_type: board.board_type as BoardType | null,
              fin_setup: board.fin_setup as BoardFinSetup | null,
              fin_system: board.fin_system as BoardFinSystem | null,
              length_inches: board.length_inches,
              volume_litres: board.volume_litres,
            },
          }}
        />
      </div>
    );
  }

  notFound();
}
