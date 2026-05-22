import Link from "next/link";
import Image from "next/image";
import { getListingImageUrl } from "@/lib/supabase/storage";
import { Badge } from "@/components/ui/badge";
import type { FinSystem, FinSizeBucket, FinPosition, FinSide, ListingCondition } from "@/lib/types/database";
import { SYSTEM_LABELS, SYSTEM_COLORS, SIZE_LABELS, POSITION_LABELS, SIDE_LABELS, CONDITION_LABELS, CONDITION_COLORS } from "@/lib/fin-labels";

// ── Types ─────────────────────────────────────────────────────────────────

export interface FinCardData {
  id: string;
  title: string;
  price_nzd: number | null;
  condition: ListingCondition;
  location_label: string | null;
  created_at: string;
  fin_details: {
    system: FinSystem;
    size_bucket: FinSizeBucket | null;
    position: FinPosition | null;
    side: FinSide;
    quantity: number;
    brand: string | null;
    model: string | null;
  };
  listing_images: { storage_path: string; display_order: number }[];
}

// ── Component ─────────────────────────────────────────────────────────────

export default function FinCard({ listing }: { listing: FinCardData }) {
  const { fin_details: fin, listing_images } = listing;

  const coverImage = listing_images
    .slice()
    .sort((a, b) => a.display_order - b.display_order)[0];

  const systemLabel = SYSTEM_LABELS[fin.system];
  const systemColor = SYSTEM_COLORS[fin.system];

  return (
    <Link
      href={`/fins/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-[var(--color-teal-300)] hover:shadow-sm transition-all"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-sand-100">
        {coverImage ? (
          <Image
            src={getListingImageUrl(coverImage.storage_path)}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground/30">
            🏄
          </div>
        )}
        {/* System badge overlaid on image */}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${systemColor}`}
        >
          {systemLabel}
        </span>
        {fin.quantity > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-semibold text-background">
            ×{fin.quantity}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {listing.title}
        </h3>

        {/* Attribute pills */}
        <div className="flex flex-wrap gap-1">
          {fin.size_bucket && (
            <Badge variant="secondary" className="text-xs">
              {SIZE_LABELS[fin.size_bucket]}
            </Badge>
          )}
          {fin.position && (
            <Badge variant="secondary" className="text-xs">
              {POSITION_LABELS[fin.position]}
            </Badge>
          )}
          {fin.side && fin.side !== "na" && (
            <Badge variant="secondary" className="text-xs">
              {SIDE_LABELS[fin.side]}
            </Badge>
          )}
          <Badge
            className={`text-xs border-0 ${CONDITION_COLORS[listing.condition]}`}
          >
            {CONDITION_LABELS[listing.condition]}
          </Badge>
        </div>

        {/* Price + location */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <span className="text-base font-semibold">
            {listing.price_nzd != null
              ? `$${listing.price_nzd.toFixed(0)}`
              : "Offer"}
          </span>
          {listing.location_label && (
            <span className="text-xs text-muted-foreground truncate">
              {listing.location_label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
