import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { getListingImageUrl } from "@/lib/supabase/storage";
import { SYSTEM_LABELS, SYSTEM_COLORS, SIZE_LABELS, POSITION_LABELS, SIDE_LABELS, CONDITION_LABELS, CONDITION_COLORS } from "@/lib/fin-labels"
import type { FinSystem, FinSizeBucket, FinPosition, FinSide, ListingCondition } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";

export default async function FinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select(`
    id, title, description, price_nzd, condition, location_label, created_at,
    fin_details!inner(system, size_bucket, position, side, quantity, brand, model),
    listing_images(storage_path, display_order)
  `).eq("id", id).single();
  if (!data) {
    return notFound();
  }
  const fin = data.fin_details as unknown as {
    system: FinSystem
    size_bucket: FinSizeBucket | null
    position: FinPosition | null
    side: FinSide
    quantity: number
    brand: string | null
    model: string | null
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {data.listing_images[0] && (
        <Image
          src={getListingImageUrl(data.listing_images[0].storage_path)}
          alt={data.title}
          width={800}
          height={800}
        />
      )}
      <h1>{data.title}</h1>
      <p>{data.price_nzd ? `$${data.price_nzd}` : "Make an offer"}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{SYSTEM_LABELS[fin.system]}</Badge>
        {fin.size_bucket && <Badge variant="secondary">{SIZE_LABELS[fin.size_bucket]}</Badge>}
        <Badge variant="secondary">{fin.position && POSITION_LABELS[fin.position]}</Badge>
        <Badge
          className={`text-xs border-0 ${CONDITION_COLORS[data.condition as ListingCondition]}`}
        >
          {CONDITION_LABELS[data.condition as ListingCondition]}</Badge>
        {fin.side && fin.side !== "na" && (
          <Badge variant="secondary">{SIDE_LABELS[fin.side]}</Badge>
        )}
      </div>
      {data.description && (
        <p className="mt-6 text-muted-foreground">{data.description}</p>
      )}
      {data.location_label && (
        <p className="mt-2 text-sm text-muted-foreground">{data.location_label}</p>
      )}
      <button className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed">
        Contact seller - Coming soon
      </button>
    </div>
  );
}